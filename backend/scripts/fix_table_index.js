import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const fixTableIndex = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) throw new Error("MONGO_URI is missing in .env");

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const update = await mongoose.connection.collection('tables').dropIndex('tableNumber_1');
        console.log("Successfully dropped 'tableNumber_1' index.");

    } catch (error) {
        if (error.code === 27) {
            console.log("Index 'tableNumber_1' not found. It might have already been removed.");
        } else {
            console.error("Error dropping index:", error);
        }
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixTableIndex();
