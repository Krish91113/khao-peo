import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      // unique: true, // Removed unique constraint solely on tableNumber, will become unique compound index
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export const Table = mongoose.model("Table", tableSchema);


