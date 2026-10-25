import mongoose from "mongoose";
import { BillModel } from "../../../billing/public.js";
import { OrderModel } from "../../../order/public.js";
import { TableModel } from "../../../table/public.js";
import { UserModel } from "../../../auth/public.js";
import { KitchenTicketModel } from "../../../kitchen/public.js";
import { validationFailed } from "../../../../shared/errors/app-error.js";

interface DateRange { from: Date; to: Date; }
function oid(value: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) throw validationFailed("Invalid restaurant id");
  return new mongoose.Types.ObjectId(value);
}
function range(from?: string, to?: string): DateRange {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 86400000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) throw validationFailed("Invalid analytics date range");
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}

async function financial(restaurantId: string, dates: DateRange) {
  const bills = await BillModel.find({ restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to } }).select("subtotal tax totalAmount paymentStatus").lean();
  const grossSales = bills.reduce((sum, bill) => sum + bill.subtotal, 0);
  const tax = bills.reduce((sum, bill) => sum + bill.tax, 0);
  const total = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const discounts = Math.max(0, grossSales + tax - total);
  const collected = bills.filter((bill) => bill.paymentStatus === "paid").reduce((sum, bill) => sum + bill.totalAmount, 0);
  return { grossSalesPaise: grossSales, discountsPaise: discounts, netSalesPaise: total - tax, taxPaise: tax, collectedPaise: collected, outstandingPaise: total - collected, billCount: bills.length, averageOrderValuePaise: bills.length ? Math.round(total / bills.length) : 0 };
}

export const analyticsService = {
  async ownerSummary(restaurantId: string, from?: string, to?: string) {
    const dates = range(from, to);
    const [money, orders, tables, kitchen] = await Promise.all([
      financial(restaurantId, dates),
      OrderModel.countDocuments({ restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to }, status: { $ne: "voided" } }),
      TableModel.countDocuments({ restaurantId: oid(restaurantId) }),
      KitchenTicketModel.countDocuments({ restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to } }),
    ]);
    return { period: { from: dates.from, to: dates.to }, ...money, orderCount: orders, tableCount: tables, kitchenTicketCount: kitchen };
  },

  async revenue(restaurantId: string, from?: string, to?: string) { return financial(restaurantId, range(from, to)); },

  async items(restaurantId: string, from?: string, to?: string) {
    const rows = await OrderModel.aggregate([
      { $match: { restaurantId: oid(restaurantId), createdAt: { $gte: range(from, to).from, $lte: range(from, to).to }, status: { $ne: "voided" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item_name", quantity: { $sum: "$items.quantity" }, salesPaise: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
      { $sort: { salesPaise: -1 } },
    ]);
    return rows.map((row) => ({ itemName: row._id, quantity: row.quantity, salesPaise: row.salesPaise }));
  },

  async tables(restaurantId: string, from?: string, to?: string) {
    const dates = range(from, to);
    const rows = await OrderModel.aggregate([
      { $match: { restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to }, status: { $ne: "voided" } } },
      { $group: { _id: "$table", orders: { $sum: 1 }, salesPaise: { $sum: "$totalAmount" } } },
      { $sort: { orders: -1 } },
    ]);
    return rows.map((row) => ({ tableId: String(row._id), orders: row.orders, salesPaise: row.salesPaise }));
  },

  async kitchen(restaurantId: string, from?: string, to?: string) {
    const dates = range(from, to);
    const tickets = await KitchenTicketModel.find({ restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to } }).select("status createdAt servedAt").lean();
    const completed = tickets.filter((ticket) => ticket.servedAt);
    const averagePreparationMinutes = completed.length ? Math.round(completed.reduce((sum, ticket) => sum + (ticket.servedAt!.getTime() - ticket.createdAt.getTime()) / 60000, 0) / completed.length) : 0;
    return { ticketCount: tickets.length, completedCount: completed.length, averagePreparationMinutes };
  },

  async staff(restaurantId: string, from?: string, to?: string) {
    const dates = range(from, to);
    const rows = await OrderModel.aggregate([
      { $match: { restaurantId: oid(restaurantId), createdAt: { $gte: dates.from, $lte: dates.to }, status: { $ne: "voided" } } },
      { $group: { _id: "$createdBy", orders: { $sum: 1 }, salesPaise: { $sum: "$totalAmount" } } },
    ]);
    const users = await UserModel.find({ restaurantId: oid(restaurantId) }).select("fullName role").lean();
    const names = new Map(users.map((user) => [String(user._id), { fullName: user.fullName, role: user.role }]));
    return rows.map((row) => ({ userId: String(row._id), ...(names.get(String(row._id)) || { fullName: "Unknown", role: "unknown" }), orders: row.orders, salesPaise: row.salesPaise }));
  },
};
