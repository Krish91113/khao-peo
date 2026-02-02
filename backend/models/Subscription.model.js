import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        plan: {
            type: String,
            enum: ["basic", "professional", "enterprise"],
            default: "basic",
        },
        status: {
            type: String,
            enum: ["active", "trial", "suspended", "cancelled", "expired"],
            default: "trial",
        },
        billing: {
            cycle: { type: String, enum: ["monthly", "yearly"] },
            amount: Number,
            currency: { type: String, default: "INR" },
            nextBillingDate: Date,
        },
        trial: {
            startDate: Date,
            endDate: Date,
            isTrialActive: Boolean,
        },
        features: {
            maxTables: Number,
            maxStaff: Number,
            analytics: Boolean,
            customBranding: Boolean,
            apiAccess: Boolean,
            multiLocation: Boolean,
        },
        paymentHistory: [
            {
                amount: Number,
                date: Date,
                status: String, // "success", "failed", "pending"
                invoiceUrl: String,
            },
        ],
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
