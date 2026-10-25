import mongoose, { Schema, type Document } from "mongoose";

export type KitchenItemStatus = "received" | "preparing" | "partially_ready" | "ready" | "cancelled";
export type KitchenTicketStatus = "received" | "preparing" | "partially_ready" | "ready" | "served" | "cancelled";

export interface IKitchenItem {
  _id?: mongoose.Types.ObjectId;
  itemId: string;
  itemName: string;
  quantity: number;
  status: KitchenItemStatus;
  startedAt?: Date;
  readyAt?: Date;
}
export interface IKitchenTicket extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  items: IKitchenItem[];
  status: KitchenTicketStatus;
  priority: number;
  pickedUpBy?: mongoose.Types.ObjectId;
  pickedUpAt?: Date;
  servedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IKitchenItem>({
  itemId: { type: String, required: true }, itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["received", "preparing", "partially_ready", "ready", "cancelled"], default: "received" },
  startedAt: Date, readyAt: Date,
}, { _id: true });
const ticketSchema = new Schema<IKitchenTicket>({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  items: { type: [itemSchema], required: true },
  status: { type: String, enum: ["received", "preparing", "partially_ready", "ready", "served", "cancelled"], default: "received" },
  priority: { type: Number, min: 0, max: 10, default: 0 },
  pickedUpBy: { type: Schema.Types.ObjectId, ref: "User" }, pickedUpAt: Date, servedAt: Date,
}, { timestamps: true });
ticketSchema.index({ restaurantId: 1, status: 1, priority: -1, createdAt: 1 });
export const KitchenTicketModel = mongoose.model<IKitchenTicket>("KitchenTicket", ticketSchema);
