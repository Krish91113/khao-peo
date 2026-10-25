import mongoose, { Schema, type Document } from "mongoose";

export type InventoryTransactionType = "stock_in" | "stock_out" | "adjustment" | "waste";

export interface IInventoryItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  active: boolean;
  seasonal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryLedger extends Document {
  restaurantId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason?: string;
  actorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const itemSchema = new Schema<IInventoryItem>({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  sku: { type: String, trim: true, maxlength: 80 },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, required: true, min: 0, default: 0 },
  active: { type: Boolean, default: true },
  seasonal: { type: Boolean, default: false },
}, { timestamps: true });

itemSchema.index({ restaurantId: 1, name: 1 });
itemSchema.index({ restaurantId: 1, sku: 1 }, { unique: true, sparse: true });

const ledgerSchema = new Schema<IInventoryLedger>({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
  type: { type: String, enum: ["stock_in", "stock_out", "adjustment", "waste"], required: true },
  quantity: { type: Number, required: true },
  beforeQuantity: { type: Number, required: true, min: 0 },
  afterQuantity: { type: Number, required: true, min: 0 },
  reason: { type: String, trim: true, maxlength: 500 },
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const InventoryItemModel = mongoose.model<IInventoryItem>("InventoryItem", itemSchema);
export const InventoryLedgerModel = mongoose.model<IInventoryLedger>("InventoryLedger", ledgerSchema);
