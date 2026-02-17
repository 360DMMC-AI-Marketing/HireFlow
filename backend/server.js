import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from './config/database.js';
// At the top
import './workers/emailWorker.js'; 
import app from './app.js';




const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start the server
await connectToDatabase();  

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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
