import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Note: This might need to be scoped to restaurantId later if we allow same email in diff restaurants, but for login simplicity keeping it unique globally for now or managing via compound index if needed. PRD says unique across platform.
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["platform_superadmin", "restaurant_owner", "restaurant_admin", "waiter", "superadmin"], // Keeping old "superadmin" temporarily for migration safety, but PRD uses specific new roles
      default: "restaurant_admin",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    lastActivity: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);


