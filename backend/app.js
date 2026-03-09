import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import authRoutes from './routes/authRoutes.js';
import jobsRouter from './routes/jobs.js';
import integrationsRouter from './routes/integrations.js';
import userRouter from './routes/user.route.js';
import companyRouter from './routes/company.js';
import questionBanksRouter from './routes/question-banks.js';
import candidatesRouter from './routes/candidates.js';
import interviewsRouter from './routes/interviews.js';
import analyticsRouter from './routes/analytics.js';
import settingsRouter from './routes/settings.js';
import billingRouter from './routes/billing.js';
import teamRouter from './routes/team.js';
import emailsRouter from './routes/emails.js';
import emailTemplatesRouter from './routes/email-templates.js';
import scheduleRouter from './routes/schedule.js';
import auditLogRouter from './routes/auditLog.js';
import errorHandler from './middleware/errorHandler.js';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Phase 3: AI Interview route ──
import aiInterviewRoutes from './routes/aiInterviews.js';

// ── Phase 4: Security middleware ──
import { mongoSanitize, xssSanitize, depthGuard } from './middleware/sanitize.js';
import { authLimiter, apiLimiter, uploadLimiter } from './middleware/rateLimiters.js';

dotenv.config();

const app = express();

// ============================================================
// 🌐 CORS CONFIGURATION
// ============================================================

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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600
};

app.use(cors(corsOptions));

// ============================================================
// 🔒 SECURITY MIDDLEWARE
// ============================================================

// 1. Helmet: Security HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://ui-avatars.com", "https://*.amazonaws.com"],
            connectSrc: ["'self'", "wss:", "https://api.deepgram.com", "https://api.elevenlabs.io"],
            frameSrc: ["'self'"]
        }
    } : false,
    frameguard: process.env.NODE_ENV === 'production' ? { action: 'deny' } : false
}));

// 2. Global rate limiter
app.use(apiLimiter);

// 3. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. NoSQL injection prevention (custom, Express 5 compatible)
app.use(mongoSanitize);

// 5. XSS sanitization
app.use(xssSanitize);

// 6. Object depth/width guard (prevents prototype pollution)
app.use(depthGuard(10, 500));

// 7. Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret_hireflow_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
}));

// 8. Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// 📁 STATIC FILE SERVING
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'assets', 'uploads')));

// ============================================================
// 🛣️ ROUTES
// ============================================================

// Auth routes with strict rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Standard API routes
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
app.use('/api/schedule', scheduleRouter);

// Phase 3: AI Video Interview endpoints
app.use('/api/v1/ai-interviews', aiInterviewRoutes);
app.use('/api/ai-interviews', aiInterviewRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/audit-log', auditLogRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

export default app;