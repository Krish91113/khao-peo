// ─── Attendance Module Public Interface ──────────────────────────────────────
// FRD Section 5.3: Only this file may be imported by other modules.

export { attendanceService } from "./application/services/attendance.service.js";
export { actionRequestService } from "./application/services/action-request.service.js";
export { attendanceRepository } from "./infrastructure/repositories/attendance.repository.js";
export { actionRequestRepository } from "./infrastructure/repositories/action-request.repository.js";
export { notificationRepository } from "./infrastructure/repositories/notification.repository.js";
export { attendanceAuditLogRepository } from "./infrastructure/repositories/audit-log.repository.js";
export { AttendanceRecordModel } from "./infrastructure/models/attendance-record.model.js";
export { ActionRequestModel } from "./infrastructure/models/action-request.model.js";
export { NotificationModel } from "./infrastructure/models/notification.model.js";
export { AttendanceAuditLogModel } from "./infrastructure/models/audit-log.model.js";
export type {
  AttendanceDTO,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceUserInfo,
} from "./domain/attendance.types.js";
export type {
  ActionRequestDTO,
  CreateActionRequestInput,
  DashboardStaffItem,
  DashboardResponse,
} from "./domain/action-request.types.js";
export {
  ATTENDANCE_AUDIT_EVENTS,
  ATTENDANCE_STATUSES,
  ACTION_REQUEST_ACTIONS,
  ACTION_REQUEST_STATUSES,
} from "./domain/attendance.constants.js";
