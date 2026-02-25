import 'dotenv/config';
import http from 'http';                                   // ⬅️ PHASE 3: NEW
import mongoose from 'mongoose';
import { connectToDatabase } from './config/database.js';
// Workers & background jobs
import './workers/emailWorker.js'; 
import './jobs/interviewReminderJob.js';
import './jobs/aiInterviewJobs.js';                        // ⬅️ PHASE 3: NEW — starts the BullMQ analysis worker
import app from './app.js';
import { initializeSocket } from './socket/socketServer.js'; // ⬅️ PHASE 3: NEW




const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start the server
await connectToDatabase();  

// Wrap app in http.createServer so Socket.io can attach to it
// (Socket.io needs the raw HTTP server, not the Express app)
const server = http.createServer(app);                     // ⬅️ PHASE 3: NEW
initializeSocket(server);                                  // ⬅️ PHASE 3: NEW

server.listen(PORT, () => {                                // ⬅️ CHANGED: server.listen instead of app.listen
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 Socket.io ready on /interview namespace`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});