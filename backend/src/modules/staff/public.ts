// ─── Staff Module Public Interface ────────────────────────────────────────────
// KP-FRD-002: Only this file may be imported by other modules.

export { staffService } from "./application/services/staff.service.js";
export { staffRepository } from "./infrastructure/repositories/staff.repository.js";
export { auditLogRepository } from "./infrastructure/repositories/audit-log.repository.js";
export { StaffAuditLogModel } from "./infrastructure/models/audit-log.model.js";
export type { StaffDTO, StaffRecord, StaffListResult } from "./domain/staff.types.js";
export { STAFF_AUDIT_EVENTS } from "./domain/staff.constants.js";
