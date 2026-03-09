import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export default async function setup() {
  const testDbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/hireflow_test';
  console.log('\n🧪 Connecting to test database:', testDbUri);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }

  // Clean all collections before tests
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }

  console.log('🧹 Test database cleaned');
  await mongoose.disconnect();
}