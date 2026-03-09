import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect('mongodb://localhost:27017/hireflow').then(async () => {
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'amir@company.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated:', result.modifiedCount);
  process.exit();
});