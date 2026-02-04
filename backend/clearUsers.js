import mongoose from 'mongoose';
import 'dotenv/config';

const clearUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Count existing users
        const count = await collection.countDocuments();
        console.log(`📊 Found ${count} users in database`);

        // Delete all users
        const result = await collection.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} users`);

        console.log('✅ Database cleared! You can now test signup again.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

clearUsers();
