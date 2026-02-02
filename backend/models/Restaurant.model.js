import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: String,
        },
        contact: {
            phone: String,
            email: String,
            contactPerson: String,
        },
        business: {
            gstNumber: String,
            fssaiNumber: String,
            businessType: String, // "cafe", "restaurant", "quick-service"
        },
        branding: {
            logo: String, // URL
            primaryColor: String,
            secondaryColor: String,
        },
        settings: {
            currency: { type: String, default: "INR" },
            timezone: { type: String, default: "Asia/Kolkata" },
            taxRates: {
                cgst: { type: Number, default: 2.5 },
                sgst: { type: Number, default: 2.5 },
                serviceCharge: { type: Number, default: 0 },
            },
            businessHours: {
                monday: { open: String, close: String, isClosed: Boolean },
                tuesday: { open: String, close: String, isClosed: Boolean },
                wednesday: { open: String, close: String, isClosed: Boolean },
                thursday: { open: String, close: String, isClosed: Boolean },
                friday: { open: String, close: String, isClosed: Boolean },
                saturday: { open: String, close: String, isClosed: Boolean },
                sunday: { open: String, close: String, isClosed: Boolean },
            },
        },
        status: {
            type: String,
            enum: ["active", "suspended", "trial", "inactive"],
            default: "trial",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
