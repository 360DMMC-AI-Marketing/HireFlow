import 'dotenv/config';
import { Worker } from 'bullmq';
import { connectToDatabase } from '../config/database.js';
import Candidate from '../models/candidate.js';
import { extractText } from '../utils/textExtractor.js';
import { analyzeResume } from '../utils/aiService.js';
import axios from 'axios';

// Check for required environment variables
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️  GEMINI_API_KEY is not set. Resume analysis will not work properly.');
  console.warn('   Get your API key at: https://aistudio.google.com/app/apikey');
}

if (!process.env.REDIS_HOST && !process.env.REDIS_PORT) {
  console.warn('⚠️  Redis configuration not found. Make sure Redis is running on localhost:6379');
}

// Connect to database
await connectToDatabase();

const worker = new Worker('resume-processing', async (job) => {
  console.log(`Processing Job ${job.id}`);
  const { fileUrl, jobId, s3Key } = job.data;

  try {
    // 1. Download file from S3 (or use local fs if local)
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];

    // 2. Extract Text
    const rawText = await extractText(fileBuffer, contentType);

    // 3. AI Analysis
    // (Optional: Fetch Job Description from DB using jobId here to pass to AI)
    const aiData = await analyzeResume(rawText, "Software Engineer");

    // 4. Create/Update Candidate in DB
    const candidate = await Candidate.create({
      ...aiData, // Spreads firstName, lastName, skills, etc.
      resumeUrl: fileUrl,
      jobId: jobId,
      status: 'Applied'
    });

    console.log(`Candidate Created: ${candidate._id}`);
    return candidate;

  } catch (error) {
    console.error("Job Failed:", error);
    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

console.log("✅ Worker started and waiting for jobs...");