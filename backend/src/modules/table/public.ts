// ─── Table Module Public Interface ──────────────────────────────────────────────
// Module: table | Public API

export { tableService } from "./application/services/table.service.js";
export { tableRepository } from "./infrastructure/repositories/table.repository.js";
export { tableAssignmentRepository } from "./infrastructure/repositories/table-assignment.repository.js";
export { tableSessionRepository } from "./infrastructure/repositories/table-session.repository.js";
export { tableAuditLogRepository } from "./infrastructure/repositories/table-audit-log.repository.js";
export type { ITable } from "./infrastructure/models/table.model.js";
export { TableModel } from "./infrastructure/models/table.model.js";
export type { ITableAssignment } from "./infrastructure/models/table-assignment.model.js";
export { TableAssignmentModel } from "./infrastructure/models/table-assignment.model.js";
export type { ITableSession } from "./infrastructure/models/table-session.model.js";
export { TableSessionModel } from "./infrastructure/models/table-session.model.js";
export type { ITableAuditLog } from "./infrastructure/models/table-audit-log.model.js";
export { TableAuditLogModel } from "./infrastructure/models/table-audit-log.model.js";
