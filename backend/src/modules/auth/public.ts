// ─── Auth Module Public Interface ─────────────────────────────────────────────
// FRD Section 5.3: Only this file may be imported by other modules.

export { authService } from "./application/services/auth.service.js";
export { userRepository } from "./infrastructure/repositories/user.repository.js";
export { UserModel } from "./infrastructure/models/user.model.js";
export type { IUser } from "./infrastructure/models/user.model.js";
