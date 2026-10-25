// ─── Action Request Application Service ──────────────────────────────────────
// Module: attendance | Layer: application
// Business rules for the admin-initiated, user-confirmed attendance workflow.
// Covers: create request, get pending, confirm, decline, and dashboard.

import {
  actionRequestRepository,
  isDuplicatePendingConflict,
} from "../../infrastructure/repositories/action-request.repository.js";
import { notificationRepository } from "../../infrastructure/repositories/notification.repository.js";
import {
  attendanceRepository,
} from "../../infrastructure/repositories/attendance.repository.js";
import { attendanceAuditLogRepository } from "../../infrastructure/repositories/audit-log.repository.js";
import { UserModel } from "../../../auth/public.js";
import { withTransaction } from "../../../../shared/database/transaction.js";
import {
  permissionDenied,
  resourceNotFound,
  staffNotActive,
  attendanceRequestAlreadyPending,
  attendanceRequestNotFound,
  attendanceRequestInvalidState,
  invalidAttendanceState,
  attendanceAlreadyActive,
} from "../../../../shared/errors/app-error.js";
import { emitToRooms } from "../../../../shared/realtime/socket.js";
import { createModuleLogger } from "../../../../shared/logging/logger.js";
import { getBusinessDate } from "../../../../shared/time/time.js";
import { getRequestContext } from "../../../../shared/http/request-context.js";
import {
  ATTENDANCE_MANAGE_ROLES,
  ADMIN_MANAGEABLE_ROLES,
  ATTENDANCE_REALTIME_EVENTS,
  ATTENDANCE_NOTIFICATION_TYPE,
  ATTENDANCE_NOTIFICATION_REF_TYPE,
  ATTENDANCE_AUDIT_EVENTS,
  ATTENDANCE_ENTITY_TYPE,
  VALID_STATE_TRANSITIONS,
  ACTION_REQUEST_EXPIRY_MS,
  type ActionRequestAction,
} from "../../domain/attendance.constants.js";
import type {
  ActionRequestDTO,
  CreateActionRequestInput,
  DashboardStaffItem,
  DashboardResponse,
} from "../../domain/action-request.types.js";
import type { ActionRequest } from "../../domain/action-request.types.js";
import type { AttendanceRecord } from "../../domain/attendance.types.js";

const log = createModuleLogger("action-request-service");

const MINUTE_MS = 60_000;

function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MINUTE_MS));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function canManage(role: string): boolean {
  return ATTENDANCE_MANAGE_ROLES.includes(role);
}

function toDTO(req: ActionRequest): ActionRequestDTO {
  return {
    id: String(req._id),
    restaurant_id: String(req.restaurantId),
    user_id: String(req.userId),
    requested_by: String(req.requestedBy),
    action: req.action,
    status: req.status,
    requested_at: req.requestedAt?.toISOString() ?? new Date().toISOString(),
    responded_at: req.respondedAt?.toISOString() ?? null,
    expires_at: req.expiresAt?.toISOString() ?? new Date().toISOString(),
    created_at: req.createdAt?.toISOString() ?? null,
    updated_at: req.updatedAt?.toISOString() ?? null,
  };
}

/**
 * Determine the effective attendance status key used by the transition map.
 * "OFF_DUTY" when no active record exists.
 */
function effectiveStatus(record: AttendanceRecord | null): string {
  if (!record) return "OFF_DUTY";
  const s = record.status;
  if (s === "checked_in") return "CHECKED_IN";
  if (s === "on_break") return "ON_BREAK";
  if (s === "checked_out") return "CHECKED_OUT";
  return "OFF_DUTY";
}

function isValidTransition(currentStatus: string, action: ActionRequestAction): boolean {
  const allowed = VALID_STATE_TRANSITIONS[currentStatus];
  return !!allowed && allowed.includes(action);
}

function actionLabel(action: ActionRequestAction): string {
  const labels: Record<string, string> = {
    CHECK_IN: "Check In",
    START_BREAK: "Start Break",
    END_BREAK: "End Break",
    CHECK_OUT: "Check Out",
  };
  return labels[action] ?? action;
}

/** Maps action to the audit event used when attendance is applied. */
function actionToAuditEvent(action: ActionRequestAction): string {
  const map: Record<string, string> = {
    CHECK_IN: ATTENDANCE_AUDIT_EVENTS.CHECKED_IN,
    START_BREAK: ATTENDANCE_AUDIT_EVENTS.BREAK_STARTED,
    END_BREAK: ATTENDANCE_AUDIT_EVENTS.BREAK_ENDED,
    CHECK_OUT: ATTENDANCE_AUDIT_EVENTS.CHECKED_OUT,
  };
  return map[action] ?? action;
}

/**
 * Close the open break on a record and recompute total break minutes.
 */
function closeOpenBreak(
  record: AttendanceRecord,
  now: Date,
): {
  breaks: AttendanceRecord["breaks"];
  totalBreakMinutes: number;
} {
  const breaks = (record.breaks ?? []).map((b) => ({
    startedAt: b.startedAt,
    endedAt: b.endedAt ?? null,
    durationMinutes: b.durationMinutes ?? null,
  }));
  const open = breaks.find((b) => !b.endedAt);
  if (open) {
    open.endedAt = now;
    open.durationMinutes = minutesBetween(open.startedAt, now);
  }
  const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.durationMinutes ?? 0), 0);
  return { breaks, totalBreakMinutes };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const actionRequestService = {
  /**
   * Admin/Owner creates an attendance action request for a staff member.
   */
  async createRequest(
    restaurantId: string,
    requesterId: string,
    requesterRole: string,
    input: CreateActionRequestInput,
  ): Promise<ActionRequestDTO> {
    // 1. Enforce manage permission
    if (!canManage(requesterRole)) {
      throw permissionDenied("Only Owner/Admin/Manager can create attendance requests");
    }

    const targetUserId = input.user_id;
    const action = input.action;

    // 2. Verify target user exists in the same restaurant
    const targetUser = await UserModel.findOne({
      _id: targetUserId,
      restaurantId,
      deletedAt: null,
    }).lean();
    if (!targetUser) {
      throw resourceNotFound("User", targetUserId);
    }
    const targetRole = (targetUser as Record<string, unknown>).role as string;
    const targetStatus = (targetUser as Record<string, unknown>).status as string;

    if (targetStatus !== "active") {
      throw staffNotActive();
    }

    // 3. Enforce permission hierarchy
    // restaurant_owner can manage everyone (including restaurant_admin)
    // restaurant_admin / manager can only manage waiter, cook, cashier
    if (requesterRole !== "restaurant_owner") {
      if (!ADMIN_MANAGEABLE_ROLES.includes(targetRole)) {
        throw permissionDenied(
          `${requesterRole} cannot manage attendance for role '${targetRole}'`,
        );
      }
    }

    // 4. Validate action is valid for current attendance state
    const activeRecord = await attendanceRepository.findActiveForUser(targetUserId, restaurantId);
    const status = effectiveStatus(activeRecord as unknown as AttendanceRecord | null);

    if (!isValidTransition(status, action)) {
      throw invalidAttendanceState(
        `Cannot perform '${action}' when status is '${status}'`,
      );
    }

    // 5. Check for existing PENDING request
    const existingPending = await actionRequestRepository.findPendingByUser(
      targetUserId,
      restaurantId,
    );
    if (existingPending) {
      throw attendanceRequestAlreadyPending();
    }

    // 6. Create PENDING request
    let request;
    try {
      request = await actionRequestRepository.create({
        restaurantId,
        userId: targetUserId,
        requestedBy: requesterId,
        action,
        expiresAt: new Date(Date.now() + ACTION_REQUEST_EXPIRY_MS),
      });
    } catch (err) {
      if (isDuplicatePendingConflict(err)) {
        throw attendanceRequestAlreadyPending();
      }
      throw err;
    }

    // 7. Create persistent notification for target user
    const requesterUser = await UserModel.findById(requesterId).select("fullName role").lean();
    const requesterName = (requesterUser as Record<string, unknown>)?.fullName as string ?? "Admin";
    const title = `${actionLabel(action)} Request`;
    const message = `${requesterName} requested to ${actionLabel(action).toLowerCase()} you.`;

    await notificationRepository.create({
      restaurantId,
      userId: targetUserId,
      type: ATTENDANCE_NOTIFICATION_TYPE,
      referenceType: ATTENDANCE_NOTIFICATION_REF_TYPE,
      referenceId: String(request._id),
      title,
      message,
    });

    // 8. Emit realtime event
    emitToRooms(
      [`user:${targetUserId}`, `restaurant:${restaurantId}:attendance`],
      ATTENDANCE_REALTIME_EVENTS.REQUEST_CREATED,
      {
        request_id: String(request._id),
        restaurant_id: restaurantId,
        user_id: targetUserId,
        requested_by: requesterId,
        action,
      },
    );

    log.info(
      { request_id: request._id, user_id: targetUserId, action },
      "Attendance action request created",
    );

    return toDTO(request as unknown as ActionRequest);
  },

  /**
   * Get pending action requests for the authenticated user.
   */
  async getPendingRequests(
    userId: string,
    restaurantId: string,
  ): Promise<ActionRequestDTO[]> {
    const requests = await actionRequestRepository.findPendingForUser(userId, restaurantId);
    return requests.map((r) => toDTO(r as unknown as ActionRequest));
  },

  /**
   * Target user confirms an action request. Applies the attendance transition
   * within a Mongo transaction.
   */
  async confirmRequest(
    requestId: string,
    userId: string,
    restaurantId: string,
    userRole: string,
  ): Promise<ActionRequestDTO> {
    // 1. Reload request
    const request = await actionRequestRepository.findById(requestId);
    if (!request) {
      throw attendanceRequestNotFound(requestId);
    }

    // 2. Require PENDING
    if (request.status !== "PENDING") {
      throw attendanceRequestInvalidState(
        `Request is '${request.status}', expected 'PENDING'`,
      );
    }

    // 3. Check expiry
    if (request.expiresAt < new Date()) {
      await actionRequestRepository.updateStatus(requestId, "EXPIRED", new Date());
      throw attendanceRequestInvalidState("Request has expired");
    }

    // 4. Only target user can confirm
    if (String(request.userId) !== userId) {
      throw permissionDenied("Only the target user can confirm this request");
    }

    // 5. Verify same restaurant
    if (String(request.restaurantId) !== restaurantId) {
      throw permissionDenied("Cross-restaurant request confirmation denied");
    }

    // 6. Reload current attendance and revalidate
    const activeRecord = await attendanceRepository.findActiveForUser(userId, restaurantId);
    const status = effectiveStatus(activeRecord as unknown as AttendanceRecord | null);
    const action = request.action;

    if (!isValidTransition(status, action)) {
      throw invalidAttendanceState(
        `Cannot perform '${action}' — attendance is now '${status}'`,
      );
    }

    // 7. Execute within a transaction
    const confirmedRequest = await withTransaction(async (session) => {
      // Mark request CONFIRMED
      const updated = await actionRequestRepository.updateStatus(
        requestId,
        "CONFIRMED",
        new Date(),
        session,
      );

      // Apply attendance transition
      const now = new Date();

      if (action === "CHECK_IN") {
        // Guard against concurrent check-ins
        const existing = await attendanceRepository.findActiveForUser(userId, restaurantId);
        if (existing) {
          throw attendanceAlreadyActive("User is already checked in");
        }
        const created = await attendanceRepository.create({
          restaurantId,
          userId,
          businessDate: getBusinessDate(now),
          checkedInAt: now,
          createdBy: String(request.requestedBy),
        });

        // Write audit
        await attendanceAuditLogRepository.create({
          restaurantId,
          actorId: String(request.requestedBy),
          actorRole: "admin_request_confirmed",
          action: actionToAuditEvent(action),
          entityType: ATTENDANCE_ENTITY_TYPE,
          entityId: String(created._id),
          userId,
          after: { status: "checked_in", checked_in_at: now },
          requestId: getRequestContext()?.request_id,
        });
      } else if (action === "START_BREAK" && activeRecord) {
        await attendanceRepository.updateById(String(activeRecord._id), restaurantId, {
          status: "on_break",
          breaks: [
            ...((activeRecord as unknown as AttendanceRecord).breaks ?? []),
            { startedAt: now, endedAt: null, durationMinutes: null },
          ],
          updatedBy: userId,
        });

        await attendanceAuditLogRepository.create({
          restaurantId,
          actorId: userId,
          actorRole: userRole,
          action: actionToAuditEvent(action),
          entityType: ATTENDANCE_ENTITY_TYPE,
          entityId: String(activeRecord._id),
          userId,
          before: { status: "checked_in" },
          after: { status: "on_break", break_started_at: now },
          requestId: getRequestContext()?.request_id,
        });
      } else if (action === "END_BREAK" && activeRecord) {
        const rec = activeRecord as unknown as AttendanceRecord;
        const { breaks, totalBreakMinutes } = closeOpenBreak(rec, now);

        await attendanceRepository.updateById(String(activeRecord._id), restaurantId, {
          status: "checked_in",
          breaks,
          totalBreakMinutes,
          updatedBy: userId,
        });

        await attendanceAuditLogRepository.create({
          restaurantId,
          actorId: userId,
          actorRole: userRole,
          action: actionToAuditEvent(action),
          entityType: ATTENDANCE_ENTITY_TYPE,
          entityId: String(activeRecord._id),
          userId,
          before: { status: "on_break" },
          after: { status: "checked_in", total_break_minutes: totalBreakMinutes },
          requestId: getRequestContext()?.request_id,
        });
      } else if (action === "CHECK_OUT" && activeRecord) {
        const rec = activeRecord as unknown as AttendanceRecord;
        const { breaks, totalBreakMinutes } = closeOpenBreak(rec, now);
        const totalWorkingMinutes = Math.max(
          0,
          minutesBetween(rec.checkedInAt, now) - totalBreakMinutes,
        );

        await attendanceRepository.updateById(String(activeRecord._id), restaurantId, {
          status: "checked_out",
          checkedOutAt: now,
          breaks,
          totalBreakMinutes,
          totalWorkingMinutes,
          isActive: false,
          updatedBy: userId,
        });

        await attendanceAuditLogRepository.create({
          restaurantId,
          actorId: userId,
          actorRole: userRole,
          action: actionToAuditEvent(action),
          entityType: ATTENDANCE_ENTITY_TYPE,
          entityId: String(activeRecord._id),
          userId,
          before: { status: rec.status },
          after: {
            status: "checked_out",
            checked_out_at: now,
            total_working_minutes: totalWorkingMinutes,
          },
          requestId: getRequestContext()?.request_id,
        });
      }

      return updated;
    });

    // 8. Update notification
    await notificationRepository.updateByReference(requestId, {
      message: `${actionLabel(action)} request — Confirmed`,
    });

    // 9. Emit realtime events
    const requestedBy = String(request.requestedBy);
    emitToRooms(
      [
        `user:${requestedBy}`,
        `user:${userId}`,
        `restaurant:${restaurantId}:attendance`,
      ],
      ATTENDANCE_REALTIME_EVENTS.REQUEST_CONFIRMED,
      {
        request_id: requestId,
        restaurant_id: restaurantId,
        user_id: userId,
        action,
      },
    );
    emitToRooms(
      [`restaurant:${restaurantId}:attendance`],
      ATTENDANCE_REALTIME_EVENTS.STATUS_CHANGED,
      {
        restaurant_id: restaurantId,
        user_id: userId,
        action,
      },
    );

    log.info({ request_id: requestId, action }, "Attendance action request confirmed");
    return toDTO(confirmedRequest as unknown as ActionRequest);
  },

  /**
   * Target user declines an action request. No attendance change.
   */
  async declineRequest(
    requestId: string,
    userId: string,
    restaurantId: string,
  ): Promise<ActionRequestDTO> {
    const request = await actionRequestRepository.findById(requestId);
    if (!request) {
      throw attendanceRequestNotFound(requestId);
    }

    if (request.status !== "PENDING") {
      throw attendanceRequestInvalidState(
        `Request is '${request.status}', expected 'PENDING'`,
      );
    }

    if (String(request.userId) !== userId) {
      throw permissionDenied("Only the target user can decline this request");
    }

    if (String(request.restaurantId) !== restaurantId) {
      throw permissionDenied("Cross-restaurant request decline denied");
    }

    const updated = await actionRequestRepository.updateStatus(
      requestId,
      "DECLINED",
      new Date(),
    );

    // Update notification
    await notificationRepository.updateByReference(requestId, {
      message: `${actionLabel(request.action)} request — Declined`,
    });

    // Notify requesting admin
    const requestedBy = String(request.requestedBy);
    emitToRooms(
      [
        `user:${requestedBy}`,
        `restaurant:${restaurantId}:attendance`,
      ],
      ATTENDANCE_REALTIME_EVENTS.REQUEST_DECLINED,
      {
        request_id: requestId,
        restaurant_id: restaurantId,
        user_id: userId,
        action: request.action,
      },
    );

    log.info({ request_id: requestId }, "Attendance action request declined");
    return toDTO(updated as unknown as ActionRequest);
  },

  /**
   * Admin dashboard: compact staff data with attendance + pending requests.
   */
  async getDashboard(
    restaurantId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<DashboardResponse> {
    if (!canManage(requesterRole)) {
      throw permissionDenied("Only Owner/Admin/Manager can view the attendance dashboard");
    }

    // Determine which roles the requester can manage
    let roleFilter: Record<string, unknown>;
    if (requesterRole === "restaurant_owner") {
      // Owner sees everyone except platform_superadmin (and themselves, but we include them)
      roleFilter = { role: { $ne: "platform_superadmin" } };
    } else {
      // Admin/Manager sees only operational staff
      roleFilter = { role: { $in: ADMIN_MANAGEABLE_ROLES } };
    }

    const staffMembers = await UserModel.find({
      restaurantId,
      deletedAt: null,
      ...roleFilter,
    })
      .select("fullName firstName lastName role status")
      .sort({ fullName: 1 })
      .lean();

    const staff: DashboardStaffItem[] = [];

    for (const member of staffMembers) {
      const m = member as Record<string, unknown>;
      const memberId = String(m._id);

      // Skip self (the requester)
      if (memberId === requesterId) continue;

      // Get active attendance
      const activeRecord = await attendanceRepository.findActiveForUser(memberId, restaurantId);
      const rec = activeRecord as unknown as AttendanceRecord | null;

      // Get pending request
      const pendingReq = await actionRequestRepository.findPendingByUser(memberId, restaurantId);

      const effectiveAttStatus = rec
        ? rec.status === "checked_in"
          ? "CHECKED_IN"
          : rec.status === "on_break"
            ? "ON_BREAK"
            : "OFF_DUTY"
        : "OFF_DUTY";

      // Find current break start time if on break
      let currentBreakStartedAt: string | null = null;
      if (rec?.status === "on_break" && rec.breaks?.length) {
        const openBreak = rec.breaks.find((b) => !b.endedAt);
        if (openBreak) {
          currentBreakStartedAt = openBreak.startedAt?.toISOString() ?? null;
        }
      }

      staff.push({
        user_id: memberId,
        name: (m.fullName as string) || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Staff",
        role: m.role as string,
        attendance: {
          status: effectiveAttStatus as "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT" | "OFF_DUTY",
          attendance_id: rec ? String(rec._id) : null,
          checked_in_at: rec?.checkedInAt?.toISOString() ?? null,
          current_break_started_at: currentBreakStartedAt,
        },
        pending_request: pendingReq
          ? {
              id: String(pendingReq._id),
              action: pendingReq.action,
              status: pendingReq.status,
              requested_at: pendingReq.requestedAt?.toISOString() ?? new Date().toISOString(),
              expires_at: pendingReq.expiresAt?.toISOString() ?? new Date().toISOString(),
            }
          : null,
      });
    }

    return { staff };
  },
};
