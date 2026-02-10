import mongoose from "mongoose";

export const connectToDatabase = async () => {
    try {   

        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }       
};

export const disconnectFromDatabase = async () => {
    try {
        await mongoose.disconnect();    
        console.log("✅ Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ MongoDB disconnection error:", error);
        process.exit(1);
    }
};

export const getDatabaseConnection = () => {
    return mongoose.connection;
};