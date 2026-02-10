import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // 1️⃣ SECURITY: HTTP Headers
import mongoSanitize from 'express-mongo-sanitize'; // 2️⃣ SECURITY: Prevent NoSQL Injection
import { rateLimit } from 'express-rate-limit'; // 3️⃣ SECURITY: Prevent Brute Force

import authRoutes from './routes/authRoutes.js';
import jobsRouter from './routes/jobs.js';
import integrationsRouter from './routes/integrations.js';
import userRouter from './routes/user.route.js';
import companyRouter from './routes/company.js';
import questionBanksRouter from './routes/question-banks.js';
import candidatesRouter from './routes/candidates.js';
import interviewsRouter from './routes/interview.js';
import analyticsRouter from './routes/analytics.js';
import settingsRouter from './routes/settings.js';
import billingRouter from './routes/billing.js';
import teamRouter from './routes/team.js';
import emailsRouter from './routes/emails.js';
import emailTemplatesRouter from './routes/email-templates.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ============================================================
// 🔒 SECURITY MIDDLEWARE
// ============================================================

// 1. Helmet: Set security HTTP headers (hides "Express" info, blocks malicious scripts)
app.use(helmet());

// 2. Rate Limiting: Limit requests from the same IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again after 15 minutes' },
    standardHeaders: 'draft-7', // Updated for Express 5 compatibility
    legacyHeaders: false,
    // Skip successful requests to reduce load
    skipSuccessfulRequests: false,
    // Validate that the library can read client IP
    validate: { xForwardedForHeader: false }
});
app.use(limiter);

// ============================================================
// 🌐 CONFIGURATION
// ============================================================

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// Body Parser Middleware (High limit for image uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Mongo Sanitize: Data Sanitization against NoSQL query injection
// ⚠️ TEMPORARILY DISABLED - express-mongo-sanitize v2.2.0 is incompatible with Express 5
// TODO: Re-enable when library is updated or switch to Express 4.x
// app.use(mongoSanitize({
//     replaceWith: '_',
//     onSanitize: ({ req, key }) => {
//         console.warn(`⚠️  Sanitized potentially malicious key: ${key}`);
//     }
// }));

// ============================================================
// 🛣️ ROUTES
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/user', userRouter);
app.use('/api/company', companyRouter);
app.use('/api/question-banks', questionBanksRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/team', teamRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/email-templates', emailTemplatesRouter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

export default app;