import mongoose from 'mongoose';
import 'dotenv/config';

const dropOldIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');
        
        // Get all indexes
        const indexes = await collection.indexes();
        console.log('📋 Current indexes:', indexes.map(i => i.name));

        // Drop the username index if it exists
        try {
            await collection.dropIndex('username_1');
            console.log('✅ Dropped username_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('⚠️  username_1 index does not exist');
            } else {
                throw err;
            }
        }

        console.log('✅ Done! You can now start your server.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

dropOldIndexes();
