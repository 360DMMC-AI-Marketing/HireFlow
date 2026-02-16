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