import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/EmailTemplate.js';
import { connectToDatabase } from '../config/database.js';

dotenv.config();
connectToDatabase();

const templates = [
  {
    name: 'application_received',
    subject: 'Application Received: {{job_title}} at {{company_name}}',
    bodyHtml: `
      <h1>Hi {{candidate_name}},</h1>
      <p>Thanks for applying to the <strong>{{job_title}}</strong> position.</p>
      <p>Our team is currently reviewing your application.</p>
      <p>Best,<br>{{company_name}} Team</p>
    `,
    variables: ['candidate_name', 'job_title', 'company_name'],
    isActive: true
  },
  {
    name: 'application_rejected',
    subject: 'Update regarding your application for {{job_title}}',
    bodyHtml: `
      <p>Dear {{candidate_name}},</p>
      <p>Thank you for giving us the opportunity to consider your application.</p>
      <p>Unfortunately, we have decided not to move forward at this time.</p>
      <p>Reason: {{rejection_reason}}</p>
      <p>We wish you the best in your job search.</p>
    `,
    variables: ['candidate_name', 'job_title', 'rejection_reason'],
    isActive: true
  },
  {
    name: 'interview_invitation',
    subject: 'Interview Invitation: {{job_title}}',
    bodyHtml: `
      <h1>Great news, {{candidate_name}}!</h1>
      <p>We would like to invite you for an interview for the {{job_title}} role.</p>
      <p><strong>Date:</strong> {{interview_date}}</p>
      <p><strong>Link:</strong> <a href="{{interview_link}}">Click here to join</a></p>
    `,
    variables: ['candidate_name', 'job_title', 'interview_date', 'interview_link'],
    isActive: true
  },
  {
    name: 'interview_reminder',
    subject: 'Reminder: Your interview is tomorrow',
    bodyHtml: `
      <h1>Hi {{candidate_name}},</h1>
      <p>This is a friendly reminder that your interview is coming up tomorrow.</p>
      <p><strong>Date:</strong> {{interview_date}}</p>
      <p>Please make sure you're prepared and join on time.</p>
      <p>Good luck!<br>The HireFlow Team</p>
    `,
    variables: ['candidate_name', 'interview_date'],
    isActive: true
  },
  {
    name: 'scheduling_link',
    subject: 'Schedule Your Interview: {{job_title}}',
    bodyHtml: `
      <h1>Great news, {{candidate_name}}!</h1>
      <p>We'd like to move forward with your application for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
      <p>Please choose a time that works best for you by clicking the link below:</p>
      <p style="margin: 24px 0;">
        <a href="{{scheduling_link}}" style="background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Schedule Your Interview
        </a>
      </p>
      <p>This link is valid for 7 days.</p>
      <p>Best regards,<br>{{company_name}} Team</p>
    `,
    variables: ['candidate_name', 'job_title', 'scheduling_link', 'company_name'],
    isActive: true
  }
];

const seed = async () => {
  try {
    await EmailTemplate.deleteMany({}); // Clears old templates
    await EmailTemplate.insertMany(templates);
    console.log('✅ Default templates created successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
};

seed();