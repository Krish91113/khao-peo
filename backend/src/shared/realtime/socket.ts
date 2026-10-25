// ─── Realtime (Socket.IO) ────────────────────────────────────────────────────
// FRD: attendance realtime events (attendance.checked_in.v1, ...) delivered to
// room `restaurant:{restaurant_id}:operations` and `user:{user_id}`.
//
// The module is safe to import in any environment: all emit helpers no-op until
// `initSocket(server)` has been called (e.g. inside tests).

import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createModuleLogger } from "../logging/logger.js";

const log = createModuleLogger("realtime");

// ENV is loaded lazily inside initSocket so importing this module (e.g. from
// tests) never requires environment variables to be present.
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

let io: SocketIOServer | null = null;

interface AttendanceRealtimePayload {
  attendance_id: string;
  user_id: string;
  status: string;
  business_date?: string;
  forced?: boolean;
}

/**
 * Attach Socket.IO to the HTTP server (idempotent).
 */
export async function initSocket(server: HttpServer): Promise<SocketIOServer> {
  if (io) return io;

  const { ENV } = await import("../config/env.js");
  const allowedOrigins = [...ALLOWED_ORIGINS, ENV.CLIENT_URL];

  const normalizeOrigin = (val?: string) => (val ? val.replace(/\/+$/, "").toLowerCase() : "");

  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (ENV.NODE_ENV === "development") {
          return callback(null, true);
        }
        const normOrigin = normalizeOrigin(origin);
        const isAllowed =
          normOrigin === normalizeOrigin(ENV.CLIENT_URL) ||
          allowedOrigins.some((o) => normalizeOrigin(o) === normOrigin) ||
          normOrigin.endsWith(".vercel.app");

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  // Authenticate every socket with the same Bearer token used by the REST API.
  io.use((socket, next) => {
    try {
      const token = (socket.handshake.auth?.token as string | undefined) ?? "";
      if (!token) {
        return next(new Error("unauthorized"));
      }
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
      mongoose
        .model("User")
        .findById(decoded.id)
        .select("-password")
        .lean()
        .then((user) => {
          if (!user) {
            return next(new Error("unauthorized"));
          }
          const userDoc = user as { _id: unknown; restaurantId?: unknown };
          socket.data.user_id = String(userDoc._id);
          socket.data.role = (userDoc as { role?: string }).role;
          socket.data.restaurant_id = userDoc.restaurantId
            ? String(userDoc.restaurantId)
            : undefined;
          next();
        })
        .catch(() => next(new Error("unauthorized")));
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const restaurantId = socket.data.restaurant_id as string | undefined;
    const userId = socket.data.user_id as string | undefined;

    if (restaurantId) {
      socket.join(`restaurant:${restaurantId}:operations`);
      socket.join(`restaurant:${restaurantId}:attendance`);
      if (["cook", "restaurant_owner", "restaurant_admin", "manager"].includes(String(socket.data.role))) {
        socket.join(`restaurant:${restaurantId}:kitchen`);
      }
      if (["restaurant_owner", "restaurant_admin", "manager"].includes(String(socket.data.role))) {
        socket.join(`restaurant:${restaurantId}:manager`);
      }
    }
    if (userId) {
      socket.join(`user:${userId}`);
    }

    log.debug(
      { user_id: userId, restaurant_id: restaurantId, socket_id: socket.id },
      "Realtime socket connected",
    );
  });

  return io;
}

/**
 * Emit an attendance realtime event to the restaurant operations room and the
 * affected user's private room. No-op when sockets are not initialized.
 */
export function emitAttendanceEvent(
  event: string,
  restaurantId: string,
  userId: string,
  payload: AttendanceRealtimePayload,
): void {
  if (!io) return;
  const message = {
    event,
    restaurant_id: restaurantId,
    user_id: userId,
    occurred_at: new Date().toISOString(),
    payload,
  };
  io.to(`restaurant:${restaurantId}:operations`).emit(event, message);
  io.to(`user:${userId}`).emit(event, message);
}

/**
 * Emit a realtime event to specified rooms. Used by the action-request
 * workflow to target the attendance room and individual user rooms.
 */
export function emitToRooms(
  rooms: string[],
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!io) return;
  const message = {
    event,
    occurred_at: new Date().toISOString(),
    ...payload,
  };
  for (const room of rooms) {
    io.to(room).emit(event, message);
  }
}
