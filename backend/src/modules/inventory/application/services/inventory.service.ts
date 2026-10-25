import mongoose from "mongoose";
import { withTransaction } from "../../../../shared/database/transaction.js";
import { resourceNotFound, validationFailed } from "../../../../shared/errors/app-error.js";
import { InventoryItemModel, InventoryLedgerModel, type InventoryTransactionType } from "../../infrastructure/models/inventory.model.js";

function objectId(value: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) throw validationFailed(`Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
}

export const inventoryService = {
  async createItem(restaurantId: string, data: { name: string; sku?: string; unit: string; lowStockThreshold?: number; seasonal?: boolean }) {
    const item = await InventoryItemModel.create({ restaurantId: objectId(restaurantId, "restaurant id"), ...data });
    return item;
  },

  async listItems(restaurantId: string, active?: boolean) {
    const filter: { restaurantId: mongoose.Types.ObjectId; active?: boolean } = { restaurantId: objectId(restaurantId, "restaurant id") };
    if (active !== undefined) filter.active = active;
    return InventoryItemModel.find(filter).sort({ name: 1 }).lean();
  },

  async getItem(restaurantId: string, itemId: string) {
    const item = await InventoryItemModel.findOne({ _id: objectId(itemId, "item id"), restaurantId: objectId(restaurantId, "restaurant id") }).lean();
    if (!item) throw resourceNotFound("Inventory item", itemId);
    return item;
  },

  async updateItem(restaurantId: string, itemId: string, data: { name?: string; sku?: string; unit?: string; lowStockThreshold?: number; active?: boolean; seasonal?: boolean }) {
    const item = await InventoryItemModel.findOneAndUpdate(
      { _id: objectId(itemId, "item id"), restaurantId: objectId(restaurantId, "restaurant id") },
      { $set: data }, { new: true, runValidators: true },
    ).lean();
    if (!item) throw resourceNotFound("Inventory item", itemId);
    return item;
  },

  async recordTransaction(restaurantId: string, itemId: string, actorId: string, data: { type: InventoryTransactionType; quantity: number; reason?: string }) {
    if (!Number.isFinite(data.quantity) || data.quantity === 0) throw validationFailed("quantity must be a non-zero number");
    if (data.type !== "adjustment" && data.quantity < 0) throw validationFailed("quantity must be positive for stock movements");
    const restaurant = objectId(restaurantId, "restaurant id");
    const item = objectId(itemId, "item id");
    const actor = objectId(actorId, "actor id");

    return withTransaction(async (session) => {
      const current = await InventoryItemModel.findOne({ _id: item, restaurantId: restaurant }).session(session);
      if (!current) throw resourceNotFound("Inventory item", itemId);
      const delta = data.type === "stock_out" || data.type === "waste" ? -data.quantity : data.quantity;
      const afterQuantity = current.quantity + delta;
      if (afterQuantity < 0) throw validationFailed("Inventory quantity cannot become negative");
      current.quantity = afterQuantity;
      await current.save({ session });
      const [ledger] = await InventoryLedgerModel.create([{
        restaurantId: restaurant, itemId: item, type: data.type, quantity: data.quantity,
        beforeQuantity: afterQuantity - delta, afterQuantity, reason: data.reason, actorId: actor,
      }], { session });
      return { item: current.toObject(), transaction: ledger };
    });
  },

  async listTransactions(restaurantId: string, itemId: string) {
    return InventoryLedgerModel.find({ restaurantId: objectId(restaurantId, "restaurant id"), itemId: objectId(itemId, "item id") }).sort({ createdAt: -1 }).lean();
  },

  async alerts(restaurantId: string) {
    return InventoryItemModel.find({ restaurantId: objectId(restaurantId, "restaurant id"), active: true, $expr: { $lte: ["$quantity", "$lowStockThreshold"] } }).sort({ quantity: 1 }).lean();
  },
};
