import { Order } from "../models/Order.model.js";
import { Table } from "../models/Table.model.js";

// @route   POST /api/orders
// @desc    Create a new order for a table (allows multiple orders per table)
// @access  Protected (admin/waiter)
export const createOrder = async (req, res) => {
  try {
    const { table_id, items, total_amount } = req.body;

    if (!table_id || !items || !items.length) {
      return res.status(400).json({ message: "Table and items are required" });
    }

    const table = await Table.findById(table_id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Mark table as booked if not already booked (first order for this table)
    if (!table.isBooked) {
      table.isBooked = true;
      await table.save();
    }

    // Transform items to match schema (item_name instead of name)
    const transformedItems = items.map(item => ({
      item_name: item.item_name || item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = await Order.create({
      table: table._id,
      items: transformedItems,
      totalAmount: total_amount,
      status: "sent_to_kitchen",
      createdBy: req.user._id,
    });

    // Update table's currentOrder to the latest order
    table.currentOrder = order._id;
    await table.save();

    // Transform order to match frontend expectations
    const transformed = {
      _id: order._id,
      id: order._id,
      table_id: table._id.toString(),
      status: order.status,
      total_amount: order.totalAmount,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      items: order.items,
    };

    return res.status(201).json(transformed);
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/orders/table/:tableId
// @desc    Get all orders for a table
// @access  Protected
export const getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const orders = await Order.find({ table: tableId })
      .populate("table", "tableNumber")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("getOrdersByTable error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (sent_to_kitchen, preparing, ready, served)
// @access  Protected (admin/waiter/kitchen)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["sent_to_kitchen", "preparing", "ready", "served"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/orders
// @desc    Get all active orders (for kitchen/waiter dashboards)
// @access  Protected
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query)
      .populate("table", "tableNumber")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


