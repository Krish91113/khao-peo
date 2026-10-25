// ─── Attendance Application Service ───────────────────────────────────────────
// Module: attendance | Layer: application
// FRD Section 23.1: Business rules live ONLY here. Controllers never contain
// logic. Covers check-in/out, break start/end, forced checkout, corrections,
// staff availability, history, self-view scoping and audit events.

import {
  attendanceRepository,
  isActiveRecordConflict,
} from "../../infrastructure/repositories/attendance.repository.js";
import { attendanceAuditLogRepository } from "../../infrastructure/repositories/audit-log.repository.js";
import {
  attendanceNotFound,
  attendanceAlreadyActive,
  attendanceAlreadyCheckedOut,
  breakAlreadyActive,
  invalidAttendanceState,
  noActiveBreak,
  permissionDenied,
  resourceNotFound,
  staffNotActive,
  validationFailed,
} from "../../../../shared/errors/app-error.js";
import { getRequestContext } from "../../../../shared/http/request-context.js";
import { buildPaginationMeta, parsePagination } from "../../../../shared/pagination/paginate.js";
import { createModuleLogger } from "../../../../shared/logging/logger.js";
import { tableService } from "../../../table/public.js";
import { getBusinessDate } from "../../../../shared/time/time.js";
import { emitAttendanceEvent } from "../../../../shared/realtime/socket.js";
import {
  ACTIVE_ATTENDANCE_STATUSES,
  ATTENDANCE_AUDIT_EVENTS,
  ATTENDANCE_ENTITY_TYPE,
  ATTENDANCE_MANAGE_ROLES,
  ATTENDANCE_REALTIME_EVENTS,
  ATTENDANCE_SORT_OPTIONS,
  type AttendanceSortKey,
} from "../../domain/attendance.constants.js";
import type {
  AttendanceDTO,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceUserInfo,
  CheckInInput,
  CheckOutInput,
  CorrectAttendanceInput,
  ListAttendanceQuery,
} from "../../domain/attendance.types.js";

const log = createModuleLogger("attendance-service");

const MINUTE_MS = 60_000;

function canManage(role: string): boolean {
  return ATTENDANCE_MANAGE_ROLES.includes(role);
}

function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MINUTE_MS));
}

function isOwnRecord(record: AttendanceRecord, actorId: string): boolean {
  return String(record.userId) === actorId;
}

function assertOwnOrManage(record: AttendanceRecord, actorId: string, actorRole: string): void {
  if (!canManage(actorRole) && !isOwnRecord(record, actorId)) {
    throw permissionDenied("You can only manage your own attendance records");
  }
}

// ─── Snapshot + DTO ──────────────────────────────────────────────────────────

function snapshot(record: AttendanceRecord): Record<string, unknown> {
  return {
    status: record.status,
    business_date: record.businessDate ?? null,
    checked_in_at: record.checkedInAt ?? null,
    checked_out_at: record.checkedOutAt ?? null,
    breaks: (record.breaks ?? []).map((b) => ({
      started_at: b.startedAt,
      ended_at: b.endedAt ?? null,
      duration_minutes: b.durationMinutes ?? null,
    })),
    total_break_minutes: record.totalBreakMinutes ?? 0,
    total_working_minutes: record.totalWorkingMinutes ?? 0,
    is_active: record.isActive,
  };
}

function toDTO(record: AttendanceRecord, userInfo: AttendanceUserInfo | null): AttendanceDTO {
  return {
    _id: String(record._id),
    id: String(record._id),
    restaurant_id: record.restaurantId ? String(record.restaurantId) : null,
    user_id: String(record.userId),
    user: userInfo,
    status: record.status,
    business_date: record.businessDate ?? null,
    checked_in_at: record.checkedInAt ?? null,
    checked_out_at: record.checkedOutAt ?? null,
    breaks: (record.breaks ?? []).map((b) => ({
      started_at: b.startedAt,
      ended_at: b.endedAt ?? null,
      duration_minutes: b.durationMinutes ?? null,
    })),
    break_count: (record.breaks ?? []).length,
    total_break_minutes: record.totalBreakMinutes ?? 0,
    total_working_minutes: record.totalWorkingMinutes ?? 0,
    is_active: record.isActive,
    note: record.note ?? null,
    corrected_at: record.correctedAt ?? null,
    corrected_by: record.correctedBy ? String(record.correctedBy) : null,
    correction_note: record.correctionNote ?? null,
    reason_code: record.reasonCode ?? null,
    version: record.version ?? 0,
    created_by: record.createdBy ? String(record.createdBy) : null,
    updated_by: record.updatedBy ? String(record.updatedBy) : null,
    created_at: record.createdAt ?? null,
    updated_at: record.updatedAt ?? null,
  };
}

// ─── Audit ────────────────────────────────────────────────────────────────────

async function writeAudit(params: {
  restaurantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: AttendanceRecord;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonText?: string;
}): Promise<void> {
  const ctx = getRequestContext();
  await attendanceAuditLogRepository.create({
    restaurantId: params.restaurantId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: params.action,
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: String(params.entity._id),
    userId: String(params.entity.userId),
    before: params.before,
    after: params.after,
    reasonText: params.reasonText,
    requestId: ctx?.request_id,
    ipAddress: ctx?.ip_address,
    userAgent: ctx?.user_agent,
  });
}

// ─── Break + total-time math ─────────────────────────────────────────────────

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

function computeWorkingMinutes(
  checkedInAt: Date,
  checkedOutAt: Date,
  totalBreakMinutes: number,
): number {
  return Math.max(0, minutesBetween(checkedInAt, checkedOutAt) - totalBreakMinutes);
}

// ─── Sort ────────────────────────────────────────────────────────────────────

function resolveSort(query: ListAttendanceQuery): AttendanceSortKey {
  const sort = query.sort?.toLowerCase() ?? "";
  if (sort in ATTENDANCE_SORT_OPTIONS) {
    return sort as AttendanceSortKey;
  }
  return "newest";
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const attendanceService = {
  /**
   * Open a new shift. Rejects when the user already has an active record
   * (ATTENDANCE_ALREADY_ACTIVE). The partial unique index guards against
   * concurrent duplicate check-ins.
   */
  async checkIn(
    restaurantId: string,
    actorId: string,
    actorRole: string,
    input: CheckInInput,
  ): Promise<AttendanceDTO> {
    const user = await attendanceRepository.findUserById(actorId, restaurantId);
    if (!user) {
      throw resourceNotFound("User", actorId);
    }
    if (user.status !== "active") {
      throw staffNotActive();
    }

    const existing = await attendanceRepository.findActiveForUser(actorId, restaurantId);
    if (existing) {
      throw attendanceAlreadyActive("You are already checked in");
    }

    let record: AttendanceRecord;
    try {
      const created = await attendanceRepository.create({
        restaurantId,
        userId: actorId,
        businessDate: getBusinessDate(new Date()),
        checkedInAt: new Date(),
        note: input.note,
        createdBy: actorId,
      });
      record = created as unknown as AttendanceRecord;
    } catch (err) {
      if (isActiveRecordConflict(err)) {
        throw attendanceAlreadyActive("You are already checked in");
      }
      throw err;
    }

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: ATTENDANCE_AUDIT_EVENTS.CHECKED_IN,
      entity: record,
      after: snapshot(record),
    });

    emitAttendanceEvent(ATTENDANCE_REALTIME_EVENTS.CHECKED_IN, restaurantId, actorId, {
      attendance_id: String(record._id),
      user_id: actorId,
      status: record.status,
      business_date: record.businessDate,
    });

    const userInfo = await attendanceRepository.toUserInfo(record);
    log.info({ attendance_id: record._id, user_id: actorId }, "Staff checked in");
    return toDTO(record, userInfo);
  },

  async startBreak(
    restaurantId: string,
    attendanceId: string,
    actorId: string,
    actorRole: string,
  ): Promise<AttendanceDTO> {
    const record = await attendanceRepository.findById(attendanceId, restaurantId);
    if (!record) {
      throw attendanceNotFound(attendanceId);
    }
    const rec = record as unknown as AttendanceRecord;
    assertOwnOrManage(rec, actorId, actorRole);

    if (rec.status === "on_break") {
      throw breakAlreadyActive();
    }
    if (rec.status !== "checked_in") {
      throw invalidAttendanceState(`Cannot start a break from status '${rec.status}'`);
    }

    const now = new Date();
    const updated = await attendanceRepository.updateById(attendanceId, restaurantId, {
      status: "on_break",
      breaks: [...(rec.breaks ?? []), { startedAt: now, endedAt: null, durationMinutes: null }],
      updatedBy: actorId,
    });
    if (!updated) {
      throw attendanceNotFound(attendanceId);
    }
    const updatedRec = updated as unknown as AttendanceRecord;

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: ATTENDANCE_AUDIT_EVENTS.BREAK_STARTED,
      entity: updatedRec,
      before: { status: "checked_in" },
      after: { status: "on_break", break_started_at: now },
    });

    emitAttendanceEvent(ATTENDANCE_REALTIME_EVENTS.BREAK_STARTED, restaurantId, String(rec.userId), {
      attendance_id: attendanceId,
      user_id: String(rec.userId),
      status: "on_break",
    });

    const userInfo = await attendanceRepository.toUserInfo(updatedRec);
    log.info({ attendance_id: attendanceId }, "Break started");
    return toDTO(updatedRec, userInfo);
  },

  async endBreak(
    restaurantId: string,
    attendanceId: string,
    actorId: string,
    actorRole: string,
  ): Promise<AttendanceDTO> {
    const record = await attendanceRepository.findById(attendanceId, restaurantId);
    if (!record) {
      throw attendanceNotFound(attendanceId);
    }
    const rec = record as unknown as AttendanceRecord;
    assertOwnOrManage(rec, actorId, actorRole);

    if (rec.status !== "on_break") {
      throw noActiveBreak(`Cannot end a break from status '${rec.status}'`);
    }

    const now = new Date();
    const { breaks, totalBreakMinutes } = closeOpenBreak(rec, now);
    const updated = await attendanceRepository.updateById(attendanceId, restaurantId, {
      status: "checked_in",
      breaks,
      totalBreakMinutes,
      updatedBy: actorId,
    });
    if (!updated) {
      throw attendanceNotFound(attendanceId);
    }
    const updatedRec = updated as unknown as AttendanceRecord;

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: ATTENDANCE_AUDIT_EVENTS.BREAK_ENDED,
      entity: updatedRec,
      before: { status: "on_break" },
      after: { status: "checked_in", total_break_minutes: totalBreakMinutes },
    });

    emitAttendanceEvent(ATTENDANCE_REALTIME_EVENTS.BREAK_ENDED, restaurantId, String(rec.userId), {
      attendance_id: attendanceId,
      user_id: String(rec.userId),
      status: "checked_in",
    });

    const userInfo = await attendanceRepository.toUserInfo(updatedRec);
    log.info({ attendance_id: attendanceId }, "Break ended");
    return toDTO(updatedRec, userInfo);
  },

  /**
   * Close a shift. A manager can force a checkout for another staff member
   * (`force: true`), which is recorded as a distinct audit event.
   */
  async checkOut(
    restaurantId: string,
    attendanceId: string,
    actorId: string,
    actorRole: string,
    input: CheckOutInput,
  ): Promise<AttendanceDTO> {
    const record = await attendanceRepository.findById(attendanceId, restaurantId);
    if (!record) {
      throw attendanceNotFound(attendanceId);
    }
    const rec = record as unknown as AttendanceRecord;
    assertOwnOrManage(rec, actorId, actorRole);

    if (input.force && !canManage(actorRole)) {
      throw permissionDenied("Only a manager can force a checkout");
    }

    if (rec.status === "checked_out") {
      throw attendanceAlreadyCheckedOut();
    }
    if (!ACTIVE_ATTENDANCE_STATUSES.includes(rec.status)) {
      throw invalidAttendanceState(`Cannot check out from status '${rec.status}'`);
    }

    const activeTableCount = await tableService.getWaiterActiveTableCount(String(rec.userId), restaurantId);
    if (activeTableCount > 0 && !input.force) {
      throw validationFailed("Cannot check out while you have active assigned tables. Reassign or release your tables first.");
    }

    const now = new Date();
    const { breaks, totalBreakMinutes } = closeOpenBreak(rec, now);
    const totalWorkingMinutes = computeWorkingMinutes(rec.checkedInAt, now, totalBreakMinutes);

    const updated = await attendanceRepository.updateById(attendanceId, restaurantId, {
      status: "checked_out",
      checkedOutAt: now,
      breaks,
      totalBreakMinutes,
      totalWorkingMinutes,
      isActive: false,
      updatedBy: actorId,
    });
    if (!updated) {
      throw attendanceNotFound(attendanceId);
    }
    const updatedRec = updated as unknown as AttendanceRecord;

    const forced = input.force || !isOwnRecord(rec, actorId);
    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: forced
        ? ATTENDANCE_AUDIT_EVENTS.FORCED_CHECKOUT
        : ATTENDANCE_AUDIT_EVENTS.CHECKED_OUT,
      entity: updatedRec,
      before: { status: rec.status },
      after: {
        status: "checked_out",
        checked_out_at: now,
        total_working_minutes: totalWorkingMinutes,
      },
      reasonText: input.note,
    });

    emitAttendanceEvent(ATTENDANCE_REALTIME_EVENTS.CHECKED_OUT, restaurantId, String(rec.userId), {
      attendance_id: attendanceId,
      user_id: String(rec.userId),
      status: "checked_out",
      forced,
    });

    const userInfo = await attendanceRepository.toUserInfo(updatedRec);
    log.info({ attendance_id: attendanceId, forced }, "Staff checked out");
    return toDTO(updatedRec, userInfo);
  },

  /**
   * Manager-only correction (gated by ATTENDANCE_MANAGE at the route layer).
   * Every correction is audited with before/after snapshots.
   */
  async correct(
    restaurantId: string,
    attendanceId: string,
    actorId: string,
    actorRole: string,
    input: CorrectAttendanceInput,
  ): Promise<AttendanceDTO> {
    const record = await attendanceRepository.findById(attendanceId, restaurantId);
    if (!record) {
      throw attendanceNotFound(attendanceId);
    }
    const rec = record as unknown as AttendanceRecord;
    const before = snapshot(rec);

    const update: Record<string, unknown> = { updatedBy: actorId };
    let checkedInAt = rec.checkedInAt;
    let checkedOutAt = rec.checkedOutAt;

    if (input.checked_in_at !== undefined) {
      checkedInAt = new Date(input.checked_in_at);
      update.checkedInAt = checkedInAt;
    }
    if (input.checked_out_at !== undefined) {
      checkedOutAt = new Date(input.checked_out_at);
      update.checkedOutAt = checkedOutAt;
      update.status = "checked_out";
      update.isActive = false;
    }
    if (input.total_break_minutes !== undefined) {
      update.totalBreakMinutes = input.total_break_minutes;
    }
    if (input.total_working_minutes !== undefined) {
      update.totalWorkingMinutes = input.total_working_minutes;
    } else if (checkedInAt && checkedOutAt) {
      update.totalWorkingMinutes = computeWorkingMinutes(
        checkedInAt,
        checkedOutAt,
        input.total_break_minutes ?? rec.totalBreakMinutes ?? 0,
      );
    }
    if (input.note !== undefined) {
      update.note = input.note;
    }
    const reasonText = input.reason_text ?? input.correction_note;
    if (input.reason_code !== undefined) {
      update.reasonCode = input.reason_code;
    }
    if (reasonText !== undefined) {
      update.correctionNote = reasonText;
      update.correctedAt = new Date();
      update.correctedBy = actorId;
    }

    const updated = await attendanceRepository.updateById(
      attendanceId,
      restaurantId,
      update as never,
    );
    if (!updated) {
      throw attendanceNotFound(attendanceId);
    }
    const updatedRec = updated as unknown as AttendanceRecord;

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: ATTENDANCE_AUDIT_EVENTS.CORRECTED,
      entity: updatedRec,
      before,
      after: snapshot(updatedRec),
      reasonText: input.reason_text ?? input.correction_note,
    });

    emitAttendanceEvent(ATTENDANCE_REALTIME_EVENTS.CORRECTED, restaurantId, String(rec.userId), {
      attendance_id: attendanceId,
      user_id: String(rec.userId),
      status: updatedRec.status,
    });

    const userInfo = await attendanceRepository.toUserInfo(updatedRec);
    log.info({ attendance_id: attendanceId }, "Attendance corrected");
    return toDTO(updatedRec, userInfo);
  },

  /**
   * History list. Non-managers are scoped to their own records.
   */
  async list(
    restaurantId: string,
    actorId: string,
    actorRole: string,
    query: ListAttendanceQuery,
  ): Promise<AttendanceListResult> {
    const pagination = parsePagination(query as unknown as Record<string, unknown>);
    const manage = canManage(actorRole);
    // Managers see all staff unless a specific user is requested; operational
    // staff are always scoped to their own records. Passing undefined leaves
    // the repository unscoped by user.
    const userId = manage ? query.user_id : actorId;
    const status = query.status as never;

    const { data, total } = await attendanceRepository.list({
      restaurantId,
      userId,
      status,
      from: query.from,
      to: query.to,
      businessDate: query.date,
      businessDateFrom: query.date_from,
      businessDateTo: query.date_to,
      skip: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit,
      sort: resolveSort(query),
    });

    const meta = buildPaginationMeta(total, pagination);
    const enriched = await Promise.all(
      data.map(async (d) => toDTO(d, await attendanceRepository.toUserInfo(d))),
    );

    return { data: enriched, meta };
  },

  /**
   * Active shifts / staff availability board. Non-managers only see their own
   * active record.
   */
  async listActive(
    restaurantId: string,
    actorId: string,
    actorRole: string,
  ): Promise<AttendanceDTO[]> {
    const manage = canManage(actorRole);
    const userId = manage ? undefined : actorId;
    const records = await attendanceRepository.listActive(restaurantId, userId);
    const enriched = await Promise.all(
      records.map(async (d) => toDTO(d, await attendanceRepository.toUserInfo(d))),
    );
    return enriched;
  },

  /**
   * History for a single staff member. Non-managers may only access their own.
   */
  async listForUser(
    restaurantId: string,
    userId: string,
    actorId: string,
    actorRole: string,
    query: ListAttendanceQuery,
  ): Promise<AttendanceListResult> {
    if (!canManage(actorRole) && userId !== actorId) {
      throw permissionDenied("You can only view your own attendance records");
    }

    const pagination = parsePagination(query as unknown as Record<string, unknown>);

    const { data, total } = await attendanceRepository.list({
      restaurantId,
      userId,
      status: query.status as never,
      from: query.from,
      to: query.to,
      businessDate: query.date,
      businessDateFrom: query.date_from,
      businessDateTo: query.date_to,
      skip: (pagination.page - 1) * pagination.limit,
      limit: pagination.limit,
      sort: resolveSort(query),
    });

    const meta = buildPaginationMeta(total, pagination);
    const enriched = await Promise.all(
      data.map(async (d) => toDTO(d, await attendanceRepository.toUserInfo(d))),
    );

    return { data: enriched, meta };
  },
};
