import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
        },
        subcategory: String,
        description: String,
        price: {
            type: Number,
            required: true,
        },
        image: String,
        isAvailable: {
            type: Boolean,
            default: true,
        },
        isVeg: {
            type: Boolean,
            default: true,
        },
        preparationTime: Number, // in minutes
        customizations: [
            {
                name: String,
                options: [
                    {
                        name: String,
                        price: Number,
                    },
                ],
                isRequired: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        tags: [String],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Compound index for faster lookups per restaurant
menuItemSchema.index({ restaurantId: 1, category: 1 });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
