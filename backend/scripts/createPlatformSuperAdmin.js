import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Manual path to .env file to ensure it's found
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Define Minimal User Schema inline to avoid import issues
const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    role: String,
    isOnline: Boolean,
    restaurantId: mongoose.Schema.Types.ObjectId,
});
const User = mongoose.model('User', userSchema);

const createPlatformSuperAdmin = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        console.log("Connecting to MongoDB...", MONGO_URI ? "URI Found" : "URI Missing");

        if (!MONGO_URI) throw new Error("MONGO_URI is missing in .env");

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        const email = "platform@khaopeeo.com";
        const password = "password123";
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Platform SuperAdmin already exists.");
            if (existingUser.role !== 'platform_superadmin') {
                existingUser.role = 'platform_superadmin';
                await existingUser.save();
                console.log("Updated role to platform_superadmin");
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                fullName: "Platform Owner",
                email,
                password: hashedPassword,
                role: "platform_superadmin",
                isOnline: true,
            });
            console.log(`Platform SuperAdmin created! Email: ${email}, Password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

createPlatformSuperAdmin();
