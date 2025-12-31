import { Bill } from "../models/Bill.model.js";
import { Order } from "../models/Order.model.js";
import { Table } from "../models/Table.model.js";

// @route   POST /api/bills
// @desc    Create kitchen receipt for an order (can be generated multiple times)
// @access  Protected (admin/waiter)
export const createBill = async (req, res) => {
  try {
    const { order_id, table_id, subtotal, tax, total_amount, items } = req.body;

    if (!order_id || !table_id) {
      return res.status(400).json({ message: "Order and table are required" });
    }

    const [order, table] = await Promise.all([
      Order.findById(order_id),
      Table.findById(table_id),
    ]);

    if (!order || !table) {
      return res.status(404).json({ message: "Order or table not found" });
    }

    const bill = await Bill.create({
      order: order._id,
      table: table._id,
      subtotal,
      tax,
      totalAmount: total_amount,
      paymentStatus: "pending",
    });

    // Transform bill to match frontend expectations
    const transformed = {
      _id: bill._id,
      id: bill._id,
      order_id: order._id.toString(),
      table_id: table._id.toString(),
      subtotal,
      tax,
      total_amount,
      payment_status: "pending",
      created_at: bill.createdAt,
      items: items || [],
      table: {
        table_number: table.tableNumber.toString(),
      },
    };

    return res.status(201).json(transformed);
  } catch (error) {
    console.error("createBill error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/bills/final/:tableId
// @desc    Create final bill for a table (combines all orders) - Admin only
// @access  Protected (admin/owner)
export const createFinalBill = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Get all orders for this table that are NOT served (current session only)
    // Exclude "served" status to avoid including orders from previous sessions
    const orders = await Order.find({
      table: table._id,
      status: { $in: ["sent_to_kitchen", "preparing", "ready", "pending"] }
    }).sort({ createdAt: 1 });

    if (orders.length === 0) {
      return res.status(400).json({ message: "No orders found for this table" });
    }

    // Combine all items from all orders
    const allItems = [];
    let totalSubtotal = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const existingItem = allItems.find(i => i.item_name === item.item_name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.price = item.price; // Use latest price
        } else {
          allItems.push({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
          });
        }
        totalSubtotal += item.price * item.quantity;
      });
    });

    const tax = totalSubtotal * 0.05; // 5% tax
    const totalAmount = totalSubtotal + tax;

    // Create final bill (use the first order as reference, but it represents all orders)
    const bill = await Bill.create({
      order: orders[0]._id, // Reference to first order, but represents all
      table: table._id,
      subtotal: totalSubtotal,
      tax,
      totalAmount,
      paymentStatus: "pending",
    });

    // Transform bill to match frontend expectations
    const transformed = {
      _id: bill._id,
      id: bill._id,
      order_id: orders[0]._id.toString(),
      table_id: table._id.toString(),
      subtotal: totalSubtotal,
      tax,
      total_amount: totalAmount,
      payment_status: "pending",
      created_at: bill.createdAt,
      items: allItems,
      table: {
        table_number: table.tableNumber.toString(),
      },
      is_final: true, // Mark as final bill
      orders_count: orders.length, // Number of orders combined
    };

    return res.status(201).json(transformed);
  } catch (error) {
    console.error("createFinalBill error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/bills
// @desc    Get all bills
// @access  Protected (owner/admin)
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("order")
      .populate("table", "tableNumber")
      .sort({ createdAt: -1 });

    const transformed = bills.map(bill => ({
      _id: bill._id,
      id: bill._id,
      order_id: bill.order?._id?.toString() || bill.order?.toString(),
      table_id: bill.table?._id?.toString() || bill.table?.toString(),
      subtotal: bill.subtotal,
      tax: bill.tax,
      total_amount: bill.totalAmount,
      payment_status: bill.paymentStatus,
      created_at: bill.createdAt,
    }));

    return res.json(transformed);
  } catch (error) {
    console.error("getAllBills error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/bills/order/:orderId
// @desc    Get bill by order id
// @access  Protected
export const getBillByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const bill = await Bill.findOne({ order: orderId })
      .populate("order")
      .populate("table", "tableNumber");
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Transform to match frontend expectations
    const transformed = {
      _id: bill._id,
      id: bill._id,
      order_id: bill.order?._id?.toString() || bill.order?.toString(),
      table_id: bill.table?._id?.toString() || bill.table?.toString(),
      subtotal: bill.subtotal,
      tax: bill.tax,
      total_amount: bill.totalAmount,
      payment_status: bill.paymentStatus,
      created_at: bill.createdAt,
      table: bill.table ? {
        table_number: bill.table.tableNumber?.toString(),
      } : null,
    };

    return res.json(transformed);
  } catch (error) {
    console.error("getBillByOrder error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


