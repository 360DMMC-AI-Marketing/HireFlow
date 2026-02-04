import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
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

// CORS configuration - allow frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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
