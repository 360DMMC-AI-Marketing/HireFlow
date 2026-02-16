import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// 1. Setup Redis Connection
const connection = new IORedis({
  host: '127.0.0.1', // Ensure Redis is running here
  port: 6379,
  maxRetriesPerRequest: null,
});

// 2. Create the Queue
export const emailQueue = new Queue('email-queue', { 
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s, then 2s, then 4s...
    },
    removeOnComplete: true, // Auto-delete job if successful
    removeOnFail: false, // Keep failed jobs for debugging
  }
});
export default emailQueue;