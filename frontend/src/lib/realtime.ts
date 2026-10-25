// ─── Realtime (Socket.IO client) ─────────────────────────────────────────────
// Subscribes to backend attendance realtime events (attendance.*.v1). A single
// socket is shared app-wide; listeners are attached per consumer.

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/client";

export const KITCHEN_EVENTS = [
  "kitchen.ticket_created.v1",
  "kitchen.item_status_changed.v1",
  "kitchen.priority_changed.v1",
  "kitchen.ticket_picked_up.v1",
  "kitchen.ticket_served.v1",
] as const;

export const ATTENDANCE_EVENTS = [
  "attendance.checked_in.v1",
  "attendance.break_started.v1",
  "attendance.break_ended.v1",
  "attendance.checked_out.v1",
  "attendance.corrected.v1",
  "attendance.request_created.v1",
  "attendance.request_confirmed.v1",
  "attendance.request_declined.v1",
  "attendance.status_changed.v1",
] as const;

let socket: Socket | null = null;
let socketToken: string | null = null;

function resolveOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
}

function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  // If the auth token changed (e.g. another user logged in without a page
  // reload), tear the old socket down so the new one authenticates correctly.
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }

  if (socket) return socket;

  socketToken = token;
  socket = io(resolveOrigin(), {
    transports: ["websocket", "polling"],
    auth: { token },
  });

  // Drop the socket when the token is rejected so a fresh one is created after
  // the user logs in again.
  socket.on("connect_error", (err) => {
    if (String(err.message).toLowerCase().includes("unauthorized")) {
      socket?.disconnect();
      socket = null;
      socketToken = null;
    }
  });

  return socket;
}

/**
 * Subscribe to all attendance realtime events. Returns an unsubscribe function.
 * Safe to call before the socket exists or while logged out (no-op).
 */
export function onKitchenEvent(listener: () => void): () => void {
  const s = getSocket();
  if (!s) return () => undefined;
  const handler = () => listener();
  KITCHEN_EVENTS.forEach((event) => s.on(event, handler));
  return () => KITCHEN_EVENTS.forEach((event) => s.off(event, handler));
}

export function onAttendanceEvent(listener: () => void): () => void {
  const s = getSocket();
  if (!s) return () => undefined;

  const handler = () => listener();
  ATTENDANCE_EVENTS.forEach((event) => s.on(event, handler));

  return () => {
    ATTENDANCE_EVENTS.forEach((event) => s.off(event, handler));
  };
}
