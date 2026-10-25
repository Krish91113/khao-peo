import mongoose from "mongoose";
import { KitchenTicketModel, type KitchenItemStatus, type KitchenTicketStatus } from "../../infrastructure/models/kitchen-ticket.model.js";
import { resourceNotFound, validationFailed } from "../../../../shared/errors/app-error.js";
import { emitToRooms } from "../../../../shared/realtime/socket.js";

function id(value: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) throw validationFailed(`Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
}

function ticketStatus(items: Array<{ status: KitchenItemStatus }>): KitchenTicketStatus {
  if (items.every((item) => item.status === "cancelled")) return "cancelled";
  if (items.every((item) => item.status === "ready" || item.status === "cancelled")) return "ready";
  if (items.some((item) => item.status === "ready") || items.some((item) => item.status === "partially_ready")) return "partially_ready";
  if (items.some((item) => item.status === "preparing")) return "preparing";
  return "received";
}

const ALLOWED_ITEM_TRANSITIONS: Record<KitchenItemStatus, readonly KitchenItemStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["partially_ready", "ready", "cancelled"],
  partially_ready: ["ready", "cancelled"],
  ready: [],
  cancelled: [],
};

export const kitchenService = {
  async createTicket(restaurantId: string, orderId: string, items: Array<{ item_name: string; quantity: number }>, session?: mongoose.ClientSession) {
    const ticket = await KitchenTicketModel.create([{
      restaurantId: id(restaurantId, "restaurant id"), orderId: id(orderId, "order id"),
      items: items.map((item, index) => ({ itemId: `${orderId}:${index}`, itemName: item.item_name, quantity: item.quantity })),
    }], session ? { session } : {});
    const created = ticket[0]!;
    emitToRooms([`restaurant:${restaurantId}:kitchen`, `restaurant:${restaurantId}:operations`], "kitchen.ticket_created.v1", { restaurant_id: restaurantId, ticket_id: String(created._id), order_id: orderId });
    return created;
  },

  async listTickets(restaurantId: string, statuses?: string[]) {
    const filter: { restaurantId: mongoose.Types.ObjectId; status?: { $in: string[] } } = { restaurantId: id(restaurantId, "restaurant id") };
    if (statuses?.length) filter.status = { $in: statuses };
    return KitchenTicketModel.find(filter).sort({ priority: -1, createdAt: 1 }).lean();
  },

  async getTicket(restaurantId: string, ticketId: string) {
    const ticket = await KitchenTicketModel.findOne({ _id: id(ticketId, "ticket id"), restaurantId: id(restaurantId, "restaurant id") }).lean();
    if (!ticket) throw resourceNotFound("Kitchen ticket", ticketId);
    return ticket;
  },

  async updateItemStatus(restaurantId: string, itemId: string, status: KitchenItemStatus) {
    const ticket = await KitchenTicketModel.findOne({ restaurantId: id(restaurantId, "restaurant id"), "items._id": id(itemId, "item id") });
    if (!ticket) throw resourceNotFound("Kitchen item", itemId);
    const item = ticket.items.find((candidate) => String(candidate._id) === itemId);
    if (!item) throw resourceNotFound("Kitchen item", itemId);
    if (item.status === status) return ticket;
    if (!ALLOWED_ITEM_TRANSITIONS[item.status].includes(status)) {
      throw validationFailed(`Cannot transition kitchen item from ${item.status} to ${status}`);
    }
    if (status === "preparing") item.startedAt = new Date();
    if (status === "ready") item.readyAt = new Date();
    item.status = status;
    ticket.status = ticketStatus(ticket.items);
    await ticket.save();
    emitToRooms([`restaurant:${restaurantId}:kitchen`, `restaurant:${restaurantId}:operations`], "kitchen.item_status_changed.v1", { restaurant_id: restaurantId, ticket_id: String(ticket._id), item_id: itemId, status });
    return ticket;
  },

  async setPriority(restaurantId: string, ticketId: string, priority: number) {
    if (!Number.isInteger(priority) || priority < 0 || priority > 10) throw validationFailed("Priority must be an integer between 0 and 10");
    const ticket = await KitchenTicketModel.findOneAndUpdate({ _id: id(ticketId, "ticket id"), restaurantId: id(restaurantId, "restaurant id") }, { $set: { priority } }, { new: true }).lean();
    if (!ticket) throw resourceNotFound("Kitchen ticket", ticketId);
    emitToRooms([`restaurant:${restaurantId}:kitchen`], "kitchen.priority_changed.v1", { restaurant_id: restaurantId, ticket_id: ticketId, priority });
    return ticket;
  },

  async pickUp(restaurantId: string, ticketId: string, userId: string) {
    const ticket = await KitchenTicketModel.findOneAndUpdate(
      { _id: id(ticketId, "ticket id"), restaurantId: id(restaurantId, "restaurant id"), status: { $nin: ["served", "cancelled"] }, pickedUpBy: { $exists: false } },
      { $set: { pickedUpBy: id(userId, "user id"), pickedUpAt: new Date() } }, { new: true },
    ).lean();
    if (!ticket) throw validationFailed("Ticket is unavailable for pickup");
    emitToRooms([`restaurant:${restaurantId}:kitchen`, `user:${userId}`], "kitchen.ticket_picked_up.v1", { restaurant_id: restaurantId, ticket_id: ticketId, user_id: userId });
    return ticket;
  },

  async dashboard(restaurantId: string) {
    const tenantId = id(restaurantId, "restaurant id");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    const tickets = await KitchenTicketModel.find({ restaurantId: tenantId }).sort({ priority: -1, createdAt: 1 }).lean();
    const today = tickets.filter((ticket) => ticket.createdAt >= start);
    const active = tickets.filter((ticket) => !["served", "cancelled"].includes(ticket.status));
    const delayed = active.filter((ticket) => now.getTime() - ticket.createdAt.getTime() >= 15 * 60 * 1000);
    const completed = today.filter((ticket) => ticket.servedAt);
    const preparationMinutes = completed.map((ticket) => (ticket.servedAt!.getTime() - ticket.createdAt.getTime()) / 60000);
    const averagePrepTime = preparationMinutes.length ? Math.round(preparationMinutes.reduce((sum, value) => sum + value, 0) / preparationMinutes.length) : 0;
    const completedOnTime = preparationMinutes.filter((value) => value <= 15).length;
    let kitchenLoad: "low" | "normal" | "high" = "low";
    if (active.length >= 8) kitchenLoad = "high";
    else if (active.length >= 4) kitchenLoad = "normal";
    return {
      new_ticket_count: active.filter((ticket) => ticket.status === "received").length,
      preparing_count: active.filter((ticket) => ticket.status === "preparing").length,
      partially_ready_count: active.filter((ticket) => ticket.status === "partially_ready").length,
      ready_count: active.filter((ticket) => ticket.status === "ready").length,
      delayed_count: delayed.length,
      completed_today: completed.length,
      average_prep_time_minutes: averagePrepTime,
      on_time_rate: completed.length ? Math.round((completedOnTime / completed.length) * 100) : 0,
      kitchen_load: kitchenLoad,
      tickets: active,
    };
  },

  async serve(restaurantId: string, ticketId: string) {
    const ticket = await KitchenTicketModel.findOneAndUpdate({ _id: id(ticketId, "ticket id"), restaurantId: id(restaurantId, "restaurant id"), status: "ready" }, { $set: { status: "served", servedAt: new Date() } }, { new: true }).lean();
    if (!ticket) throw validationFailed("Only ready tickets can be served");
    emitToRooms([`restaurant:${restaurantId}:kitchen`, `restaurant:${restaurantId}:operations`], "kitchen.ticket_served.v1", { restaurant_id: restaurantId, ticket_id: ticketId });
    return ticket;
  },
};
