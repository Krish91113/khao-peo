// ─── Staff Application Service ────────────────────────────────────────────────
// Module: staff | Layer: application
// KP-FRD-002: Business rules live ONLY here. Controllers never contain logic.
// Covers BR-001..BR-010, employee code generation (BR-005), soft delete
// (BR-006), RBAC enforcement points and audit events (BR-009, Section 24).

import bcrypt from "bcryptjs";
import {
  staffRepository,
  type StaffUpdateData,
} from "../../infrastructure/repositories/staff.repository.js";
import { auditLogRepository } from "../../infrastructure/repositories/audit-log.repository.js";
import { restaurantRepository } from "../../../restaurant/public.js";
import {
  resourceNotFound,
  staffNotFound,
  emailAlreadyExists,
  phoneAlreadyExists,
  invalidRole,
  invalidStatus,
  permissionDenied,
  validationFailed,
} from "../../../../shared/errors/app-error.js";
import { getRequestContext } from "../../../../shared/http/request-context.js";
import { buildPaginationMeta } from "../../../../shared/pagination/paginate.js";
import { createModuleLogger } from "../../../../shared/logging/logger.js";
import {
  STAFF_ROLE_MAP,
  STAFF_STATUS_MAP,
  STAFF_AUDIT_EVENTS,
  STAFF_ENTITY_TYPE,
  STAFF_SORT_OPTIONS,
  MAX_EMPLOYEE_CODE_RETRIES,
  type StaffSortKey,
} from "../../domain/staff.constants.js";
import type {
  CreateStaffInput,
  ListStaffQuery,
  StaffDTO,
  StaffListResult,
  StaffRecord,
  UpdateStaffInput,
  UpdateStaffStatusInput,
} from "../../domain/staff.types.js";

const log = createModuleLogger("staff-service");

// ─── Normalisation ───────────────────────────────────────────────────────────
// FRD role/status names (OWNER, CHEF, ACTIVE, ...) are mapped to stored values
// so the shared `users` collection stays compatible with other modules.

function normalizeRole(role: string): string {
  const normalized = STAFF_ROLE_MAP[role];
  if (!normalized) {
    throw invalidRole(role);
  }
  return normalized;
}

function normalizeStatus(status: string | undefined): string {
  if (status === undefined) {
    return "active";
  }
  const normalized = STAFF_STATUS_MAP[status];
  if (!normalized) {
    throw invalidStatus(status);
  }
  return normalized;
}

// ─── Employee code (BR-005) ──────────────────────────────────────────────────

function parseEmployeeCodeNumber(code: string): number {
  const match = code.match(/(\d+)\s*$/);
  return match ? parseInt(match[1]!, 10) : 0;
}

async function generateEmployeeCode(restaurantId: string): Promise<string> {
  const latest = await staffRepository.findLatestEmployeeCode(restaurantId);
  const next = latest ? parseEmployeeCodeNumber(latest) + 1 : 1;
  return `EMP-${String(next).padStart(5, "0")}`;
}

function isEmployeeCodeConflict(err: unknown): boolean {
  if (err && typeof err === "object") {
    const e = err as { code?: number; message?: string };
    return e.code === 11000 && typeof e.message === "string" && e.message.includes("employeeCode");
  }
  return false;
}

async function createWithCodeRetry<T>(
  restaurantId: string,
  fn: (employeeCode: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_EMPLOYEE_CODE_RETRIES; attempt++) {
    const employeeCode = await generateEmployeeCode(restaurantId);
    try {
      return await fn(employeeCode);
    } catch (err) {
      lastError = err;
      if (!isEmployeeCodeConflict(err)) {
        throw err;
      }
    }
  }
  throw lastError;
}

// ─── Snapshot + DTO ──────────────────────────────────────────────────────────

function snapshot(user: StaffRecord): Record<string, unknown> {
  return {
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
    full_name: user.fullName ?? null,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    status: user.status,
    joined_at: user.joinedAt ?? null,
    profile_image: user.profileImage ?? null,
  };
}

function toStaffDTO(u: StaffRecord): StaffDTO {
  const firstName = u.firstName ?? null;
  const lastName = u.lastName ?? null;
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : (u.fullName ?? null);

  return {
    _id: String(u._id),
    id: String(u._id),
    restaurant_id: u.restaurantId ? String(u.restaurantId) : null,
    employee_code: u.employeeCode ?? null,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    status: u.status,
    profile_image: u.profileImage ?? null,
    joined_at: u.joinedAt ?? u.createdAt ?? null,
    created_by: u.createdBy ? String(u.createdBy) : null,
    updated_by: u.updatedBy ? String(u.updatedBy) : null,
    created_at: u.createdAt ?? null,
    updated_at: u.updatedAt ?? null,
    deleted_at: u.deletedAt ?? null,
  };
}

function toDTO(doc: StaffRecord): StaffDTO {
  return toStaffDTO(doc);
}

// ─── Audit (BR-009, Section 24) ──────────────────────────────────────────────

async function writeAudit(params: {
  restaurantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: StaffRecord;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonCode?: string;
  reasonText?: string;
}): Promise<void> {
  const ctx = getRequestContext();
  await auditLogRepository.create({
    restaurantId: params.restaurantId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: params.action,
    entityType: STAFF_ENTITY_TYPE,
    entityId: String(params.entity._id),
    before: params.before,
    after: params.after,
    reasonCode: params.reasonCode,
    reasonText: params.reasonText,
    requestId: ctx?.request_id,
    ipAddress: ctx?.ip_address,
    userAgent: ctx?.user_agent,
  });
}

// ─── Sort ────────────────────────────────────────────────────────────────────

function resolveSort(query: ListStaffQuery): StaffSortKey {
  const sortKey = query.sort?.toLowerCase() ?? "";
  if (sortKey in STAFF_SORT_OPTIONS) {
    return sortKey as StaffSortKey;
  }
  if (query.sort_by === "joinedAt" || query.sort_by === "joined_at") {
    return "joined";
  }
  if (query.sort_by === "firstName" || query.sort_by === "first_name") {
    return query.sort_order === "asc" ? "name_asc" : "name_desc";
  }
  return "newest";
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const staffService = {
  /**
   * BR-007/BR-008: Only Owner/Admin (permission-gated at route layer) reach here.
   * BR-010: Staff must reference an existing restaurant.
   */
  async createStaff(
    restaurantId: string,
    actorId: string,
    actorRole: string,
    input: CreateStaffInput,
  ): Promise<StaffDTO> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", restaurantId);
    }

    const email = input.email.trim().toLowerCase();
    const existingEmail = await staffRepository.findByEmail(email, restaurantId);
    if (existingEmail) {
      throw emailAlreadyExists();
    }

    const phone = input.phone?.trim();
    if (phone) {
      const existingPhone = await staffRepository.findByPhone(phone, restaurantId);
      if (existingPhone) {
        throw phoneAlreadyExists();
      }
    }

    const role = normalizeRole(input.role);
    const status = normalizeStatus(input.status);
    const firstName = input.first_name.trim();
    const lastName = input.last_name?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const user = await createWithCodeRetry(restaurantId, (employeeCode) =>
      staffRepository.create({
        restaurantId,
        fullName,
        email,
        password: hashedPassword,
        role,
        status,
        firstName,
        lastName,
        phone,
        employeeCode,
        profileImage: input.profile_image,
        joinedAt: input.joined_at ? new Date(input.joined_at) : new Date(),
        createdBy: actorId,
      }),
    );

    const dto = toDTO(user as unknown as StaffRecord);

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: STAFF_AUDIT_EVENTS.CREATED,
      entity: user as unknown as StaffRecord,
      after: snapshot(user as unknown as StaffRecord),
    });

    log.info({ staff_id: dto.id, role }, "Staff created");
    return dto;
  },

  async getStaffById(id: string, restaurantId: string): Promise<StaffDTO> {
    const user = await staffRepository.findById(id, restaurantId);
    if (!user) {
      throw staffNotFound(id);
    }
    return toDTO(user as unknown as StaffRecord);
  },

  /**
   * Waiter/Chef can only view their own profile via getMyProfile; the list is
   * gated by STAFF_READ at the route layer.
   */
  async getMyProfile(userId: string, restaurantId?: string): Promise<StaffDTO> {
    if (!restaurantId) {
      throw staffNotFound();
    }
    const user = await staffRepository.findById(userId, restaurantId);
    if (!user) {
      throw staffNotFound();
    }
    return toDTO(user as unknown as StaffRecord);
  },

  /**
   * Search (Section 17), filters (Section 18), pagination (Section 19),
   * sorting (Section 20).
   */
  async listStaff(restaurantId: string, query: ListStaffQuery): Promise<StaffListResult> {
    const page = Math.max(1, Number(query.page) || 1);
    const rawLimit = Number(query.limit) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 100);
    const skip = (page - 1) * limit;
    const sort = resolveSort(query);

    const { data, total } = await staffRepository.list({
      restaurantId,
      search: query.search,
      role: query.role ? normalizeRole(query.role) : undefined,
      status: query.status ? normalizeStatus(query.status) : undefined,
      joinedFrom: query.joined_from,
      joinedTo: query.joined_to,
      skip,
      limit,
      sort,
    });

    const meta = buildPaginationMeta(total, {
      page,
      limit,
      sort_by: sort,
      sort_order: "desc",
    });

    return {
      data: data.map((d) => toDTO(d)),
      meta,
    };
  },

  async updateStaff(
    id: string,
    restaurantId: string,
    actorId: string,
    actorRole: string,
    input: UpdateStaffInput,
  ): Promise<StaffDTO> {
    const existing = await staffRepository.findById(id, restaurantId);
    if (!existing) {
      throw staffNotFound(id);
    }

    const before = snapshot(existing as unknown as StaffRecord);
    const update: StaffUpdateData = { updatedBy: actorId };
    let roleChanged = false;

    if (input.role !== undefined) {
      const newRole = normalizeRole(input.role);
      if (newRole !== existing.role) {
        roleChanged = true;
        update.role = newRole;
      }
    }

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (email !== existing.email) {
        const dup = await staffRepository.findByEmail(email, restaurantId);
        if (dup && String(dup._id) !== id) {
          throw emailAlreadyExists();
        }
        update.email = email;
      }
    }

    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      if (phone !== existing.phone) {
        if (phone) {
          const dup = await staffRepository.findByPhone(phone, restaurantId);
          if (dup && String(dup._id) !== id) {
            throw phoneAlreadyExists();
          }
        }
        update.phone = phone;
      }
    }

    if (input.first_name !== undefined) {
      update.firstName = input.first_name.trim();
    }
    if (input.last_name !== undefined) {
      update.lastName = input.last_name.trim();
    }
    if (input.first_name !== undefined || input.last_name !== undefined) {
      const nextFirst = update.firstName ?? existing.firstName;
      const nextLast = update.lastName ?? existing.lastName;
      update.fullName = [nextFirst, nextLast].filter(Boolean).join(" ");
    }

    if (input.profile_image !== undefined) {
      update.profileImage = input.profile_image;
    }
    if (input.joined_at !== undefined) {
      update.joinedAt = new Date(input.joined_at);
    }
    if (input.status !== undefined) {
      update.status = normalizeStatus(input.status);
    }
    if (input.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(input.password, salt);
    }

    const updated = await staffRepository.updateById(id, restaurantId, update);
    if (!updated) {
      throw staffNotFound(id);
    }

    const after = snapshot(updated as unknown as StaffRecord);

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: STAFF_AUDIT_EVENTS.UPDATED,
      entity: updated as unknown as StaffRecord,
      before,
      after,
    });

    if (roleChanged) {
      await writeAudit({
        restaurantId,
        actorId,
        actorRole,
        action: STAFF_AUDIT_EVENTS.ROLE_CHANGED,
        entity: updated as unknown as StaffRecord,
        before: { role: existing.role },
        after: { role: updated.role },
      });
    }

    log.info({ staff_id: id }, "Staff updated");
    return toDTO(updated as unknown as StaffRecord);
  },

  async updateStaffStatus(
    id: string,
    restaurantId: string,
    actorId: string,
    actorRole: string,
    input: UpdateStaffStatusInput,
  ): Promise<StaffDTO> {
    if (id === actorId) {
      throw validationFailed("You cannot change your own status");
    }

    const existing = await staffRepository.findById(id, restaurantId);
    if (!existing) {
      throw staffNotFound(id);
    }

    const status = normalizeStatus(input.status);
    if (status === existing.status) {
      return toDTO(existing as unknown as StaffRecord);
    }

    const updated = await staffRepository.updateById(id, restaurantId, {
      status,
      updatedBy: actorId,
    });
    if (!updated) {
      throw staffNotFound(id);
    }

    const action =
      status === "active" ? STAFF_AUDIT_EVENTS.REACTIVATED : STAFF_AUDIT_EVENTS.DEACTIVATED;

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action,
      entity: updated as unknown as StaffRecord,
      before: { status: existing.status },
      after: { status },
      reasonCode: input.reason_code,
      reasonText: input.reason_text,
    });

    log.info({ staff_id: id, status }, "Staff status updated");
    return toDTO(updated as unknown as StaffRecord);
  },

  /**
   * BR-006: Soft delete only — the record is never physically removed.
   */
  async deleteStaff(id: string, restaurantId: string, actorId: string, actorRole: string) {
    if (id === actorId) {
      throw validationFailed("You cannot delete your own account");
    }

    const existing = await staffRepository.findById(id, restaurantId);
    if (!existing) {
      throw staffNotFound(id);
    }

    if (existing.role === "platform_superadmin" || existing.role === "restaurant_owner") {
      throw permissionDenied("Owner and platform superadmin accounts cannot be deleted");
    }

    const deleted = await staffRepository.softDelete(id, restaurantId, actorId);
    if (!deleted) {
      throw staffNotFound(id);
    }

    await writeAudit({
      restaurantId,
      actorId,
      actorRole,
      action: STAFF_AUDIT_EVENTS.DEACTIVATED,
      entity: deleted as unknown as StaffRecord,
      before: { status: existing.status, deleted_at: null },
      after: { status: "inactive", deleted_at: new Date() },
    });

    log.info({ staff_id: id }, "Staff soft-deleted");
    return toDTO(deleted as unknown as StaffRecord);
  },
};
