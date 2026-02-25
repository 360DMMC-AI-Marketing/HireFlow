import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { analyzeInterview } from '../services/aiAnalysisService.js';
import { calculateOverallAttention } from '../services/attentionService.js';

// Match the same Redis config as your emailWorker.js
const connection = new IORedis({ 
  host: process.env.REDIS_HOST || '127.0.0.1', 
  port: parseInt(process.env.REDIS_PORT) || 6379, 
  maxRetriesPerRequest: null    // ← BullMQ requires this
});

// ── Queue ──
export const aiAnalysisQueue = new Queue('ai-interview-analysis', { connection });

// ── Worker ──
const worker = new Worker('ai-interview-analysis', async (job) => {
  const { sessionId } = job.data;
  console.log(`[AI Job] Analyzing interview: ${sessionId}`);

  // 1. Calculate attention scores from raw data
  await calculateOverallAttention(sessionId);

  // 2. Run Gemini analysis (per-question + overall + resume comparison)
  await analyzeInterview(sessionId);

  console.log(`[AI Job] Analysis complete: ${sessionId}`);
}, {
  connection,
  concurrency: 2,
  limiter: { max: 5, duration: 60000 }
});

worker.on('completed', (job) =>
  console.log(`[AI Job] Done: ${job.data.sessionId}`)
);

worker.on('failed', (job, err) =>
  console.error(`[AI Job] Failed: ${job.data.sessionId}`, err.message)
);