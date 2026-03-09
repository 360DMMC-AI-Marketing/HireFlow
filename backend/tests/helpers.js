import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/user.js';
import Job from '../models/job.js';
import Candidate from '../models/candidate.js';

const TEST_DB = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/hireflow_test';

export async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function cleanDb() {
  const collections = await mongoose.connection.db.collections();
  for (const col of collections) {
    await col.deleteMany({});
  }
}

// Create a verified user and return user + JWT token
export async function createTestUser(overrides = {}) {
  const userData = {
    email: `test_${Date.now()}@hireflow.com`,
    password: 'TestPass123!',
    companyName: 'Test Company',
    industry: 'Technology',
    companySize: '1-10',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true,
    ...overrides
  };

  const user = await User.create(userData);
  const token = user.getSignedJwtToken();

  return { user, token, password: userData.password };
}

// Create a test job
export async function createTestJob(userId, overrides = {}) {
  const jobData = {
    title: `Test Job ${Date.now()}`,
    department: 'Engineering',
    employmentType: 'Full-time',
    location: 'Remote',
    description: 'This is a test job description for unit testing purposes.',
    status: 'Active',
    createdBy: userId,
    ...overrides
  };

  return Job.create(jobData);
}

// Create a test candidate
export async function createTestCandidate(jobId, overrides = {}) {
  const candidateData = {
    name: `Test Candidate ${Date.now()}`,
    email: `candidate_${Date.now()}@test.com`,
    status: 'New',
    source: 'HireFlow Direct',
    positionApplied: 'Test Position',
    jobId,
    ...overrides
  };

  return Candidate.create(candidateData);
}