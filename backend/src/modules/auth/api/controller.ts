// ─── Auth Controller ──────────────────────────────────────────────────────────
// Module: auth | Layer: api
// FRD: Controllers handle HTTP input/output ONLY. Delegates to authService.

import type { Response, NextFunction } from "express";
import { authService } from "../application/services/auth.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

export const authController = {
  /**
   * POST /api/v1/auth/login
   */
  async login(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Backward compatibility: return flat structure alongside new format
      sendSuccess(res, {
        user: result.user,
        token: result.access_token, // Legacy field
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/register
   */
  async register(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, password, role } = req.body;
      const result = await authService.register({ fullName, email, password, role });

      sendSuccess(
        res,
        {
          user: result.user,
          token: result.access_token, // Legacy field
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id || req.user?.id;
      if (userId) {
        await authService.logout(userId);
      }

      sendSuccess(res, { message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async me(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        sendSuccess(res, null, 401);
        return;
      }

      const user = await authService.getMe(userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/change_password
   */
  async changePassword(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        sendSuccess(res, null, 401);
        return;
      }

      const { current_password, new_password } = req.body;
      await authService.changePassword(userId, current_password, new_password);

      sendSuccess(res, { message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/refresh_token
   */
  async refreshToken(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const tokens = await authService.refreshToken(refresh_token);

      sendSuccess(res, tokens);
    } catch (err) {
      next(err);
    }
  },
};
