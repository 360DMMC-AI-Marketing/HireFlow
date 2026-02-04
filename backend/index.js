import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { Router } from 'express';
import authRouter from './auth/auth.js';
import jobsRouter from './jobs/jobs.js';
import integrationsRouter from './integrations/integrations.js';
import userRouter from './user/user.js';
import companyRouter from './company/company.js';
import questionBanksRouter from './question-banks/question-banks.js';
import candidatesRouter from './candidates/candidates.js';
import interviewsRouter from './interview/interview.js';
import analyticsRouter from './analytics/analytics.js';
import settingsRouter from './settings/settings.js';
import billingRouter from './billing/billing.js';
import teamRouter from './team/team.js';
import emailsRouter from './emails/emails.js';
import emailTemplatesRouter from './email-templates/email-templates.js';

const app = express();
const PORT = process.env.PORT || 3000;
const router = Router();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.use('/auth', authRouter);
router.use('/jobs', jobsRouter);
router.use('/integrations', integrationsRouter);
router.use('/user', userRouter);
router.use('/company', companyRouter);
router.use('/question-banks', questionBanksRouter);
router.use('/candidates', candidatesRouter);
router.use('/interviews', interviewsRouter);
router.use('/analytics', analyticsRouter);
router.use('/settings', settingsRouter);
router.use('/billing', billingRouter);
router.use('/team', teamRouter);
router.use('/emails', emailsRouter);
router.use('/email-templates', emailTemplatesRouter);

app.use('/api', router);

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