// ─── Application Error Class ──────────────────────────────────────────────────
// FRD Section 15: Typed error codes with operational flag.

export type ErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "USER_INACTIVE"
  | "USER_SUSPENDED"
  | "ACCOUNT_LOCKED"
  | "PERMISSION_DENIED"
  | "TENANT_ACCESS_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_FAILED"
  | "STAFF_NOT_FOUND"
  | "ATTENDANCE_NOT_FOUND"
  | "ATTENDANCE_ALREADY_ACTIVE"
  | "ATTENDANCE_ALREADY_CHECKED_OUT"
  | "INVALID_ATTENDANCE_STATE"
  | "BREAK_ALREADY_ACTIVE"
  | "NO_ACTIVE_BREAK"
  | "STAFF_NOT_ACTIVE"
  | "ATTENDANCE_REQUEST_ALREADY_PENDING"
  | "ATTENDANCE_REQUEST_NOT_FOUND"
  | "ATTENDANCE_REQUEST_INVALID_STATE"
  | "EMAIL_ALREADY_EXISTS"
  | "PHONE_ALREADY_EXISTS"
  | "INVALID_ROLE"
  | "INVALID_STATUS"
  | "INVALID_STATUS_TRANSITION"
  | "VERSION_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "FEATURE_DISABLED"
  | "RATE_LIMIT_EXCEEDED"
  | "DEPENDENCY_UNAVAILABLE"
  | "TABLE_ALREADY_ASSIGNED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status_code: number;
  public readonly details: Record<string, unknown>;
  public readonly is_operational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    status_code: number,
    details: Record<string, unknown> = {},
    is_operational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status_code = status_code;
    this.details = details;
    this.is_operational = is_operational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Factory Functions ──────────────────────────────────────────────────

export function authenticationRequired(message = "Authentication is required"): AppError {
  return new AppError("AUTHENTICATION_REQUIRED", message, 401);
}

export function invalidCredentials(message = "Invalid credentials"): AppError {
  return new AppError("INVALID_CREDENTIALS", message, 401);
}

export function tokenExpired(message = "Token has expired"): AppError {
  return new AppError("TOKEN_EXPIRED", message, 401);
}

export function tokenRevoked(message = "Token has been revoked"): AppError {
  return new AppError("TOKEN_REVOKED", message, 401);
}

export function userInactive(message = "User account is inactive"): AppError {
  return new AppError("USER_INACTIVE", message, 403);
}

export function userSuspended(message = "User account is suspended"): AppError {
  return new AppError("USER_SUSPENDED", message, 403);
}

export function accountLocked(message = "Account is temporarily locked"): AppError {
  return new AppError("ACCOUNT_LOCKED", message, 423);
}

export function permissionDenied(message = "You do not have permission"): AppError {
  return new AppError("PERMISSION_DENIED", message, 403);
}

export function tenantAccessDenied(message = "Access denied for this restaurant"): AppError {
  return new AppError("TENANT_ACCESS_DENIED", message, 403);
}

export function resourceNotFound(entity: string, id?: string): AppError {
  const message = id ? `${entity} with id '${id}' not found` : `${entity} not found`;
  return new AppError("RESOURCE_NOT_FOUND", message, 404);
}

export function validationFailed(
  message = "Validation failed",
  details: Record<string, unknown> = {},
): AppError {
  return new AppError("VALIDATION_FAILED", message, 422, details);
}

// ─── KP-FRD-002 Staff Error Codes ────────────────────────────────────────────

export function staffNotFound(id?: string): AppError {
  const message = id ? `Staff with id '${id}' not found` : "Staff not found";
  return new AppError("STAFF_NOT_FOUND", message, 404);
}

// ─── Attendance Error Codes ───────────────────────────────────────────────────

export function attendanceNotFound(id?: string): AppError {
  const message = id
    ? `Attendance record with id '${id}' not found`
    : "Attendance record not found";
  return new AppError("ATTENDANCE_NOT_FOUND", message, 404);
}

export function attendanceAlreadyActive(
  message = "An attendance record is already active",
): AppError {
  return new AppError("ATTENDANCE_ALREADY_ACTIVE", message, 409);
}

export function attendanceAlreadyCheckedOut(
  message = "Attendance record is already checked out",
): AppError {
  return new AppError("ATTENDANCE_ALREADY_CHECKED_OUT", message, 409);
}

export function invalidAttendanceState(
  message = "Invalid attendance status transition",
): AppError {
  return new AppError("INVALID_ATTENDANCE_STATE", message, 409);
}

export function breakAlreadyActive(message = "A break is already active"): AppError {
  return new AppError("BREAK_ALREADY_ACTIVE", message, 409);
}

export function noActiveBreak(message = "No active break to end"): AppError {
  return new AppError("NO_ACTIVE_BREAK", message, 409);
}

export function staffNotActive(message = "Staff member is not active"): AppError {
  return new AppError("STAFF_NOT_ACTIVE", message, 409);
}

export function attendanceRequestAlreadyPending(
  message = "An attendance action request is already pending for this user",
): AppError {
  return new AppError("ATTENDANCE_REQUEST_ALREADY_PENDING", message, 409);
}

export function attendanceRequestNotFound(id?: string): AppError {
  const message = id
    ? `Attendance action request with id '${id}' not found`
    : "Attendance action request not found";
  return new AppError("ATTENDANCE_REQUEST_NOT_FOUND", message, 404);
}

export function attendanceRequestInvalidState(
  message = "Attendance action request is not in a valid state",
): AppError {
  return new AppError("ATTENDANCE_REQUEST_INVALID_STATE", message, 409);
}

export function emailAlreadyExists(message = "Email already exists for this restaurant"): AppError {
  return new AppError("EMAIL_ALREADY_EXISTS", message, 409);
}

export function phoneAlreadyExists(
  message = "Phone number already exists for this restaurant",
): AppError {
  return new AppError("PHONE_ALREADY_EXISTS", message, 409);
}

export function invalidRole(role?: string): AppError {
  const message = role ? `Invalid role: '${role}'` : "Invalid role";
  return new AppError("INVALID_ROLE", message, 422);
}

export function invalidStatus(status?: string): AppError {
  const message = status ? `Invalid status: '${status}'` : "Invalid status";
  return new AppError("INVALID_STATUS", message, 422);
}

export function invalidStatusTransition(from: string, to: string): AppError {
  return new AppError(
    "INVALID_STATUS_TRANSITION",
    `Cannot transition from '${from}' to '${to}'`,
    409,
  );
}

export function versionConflict(message = "Resource has been modified"): AppError {
  return new AppError("VERSION_CONFLICT", message, 409);
}

export function idempotencyConflict(
  message = "Duplicate request with different payload",
): AppError {
  return new AppError("IDEMPOTENCY_CONFLICT", message, 409);
}

export function featureDisabled(feature: string): AppError {
  return new AppError("FEATURE_DISABLED", `Feature '${feature}' is not enabled`, 403);
}

export function rateLimitExceeded(message = "Too many requests"): AppError {
  return new AppError("RATE_LIMIT_EXCEEDED", message, 429);
}

export function dependencyUnavailable(service: string): AppError {
  return new AppError(
    "DEPENDENCY_UNAVAILABLE",
    `Service '${service}' is currently unavailable`,
    503,
    {},
    false,
  );
}

export function tableAlreadyAssigned(
  message = "Table is already assigned to another waiter",
): AppError {
  return new AppError("TABLE_ALREADY_ASSIGNED", message, 409);
}

export function internalError(message = "An unexpected error occurred"): AppError {
  return new AppError("INTERNAL_ERROR", message, 500, {}, false);
}
