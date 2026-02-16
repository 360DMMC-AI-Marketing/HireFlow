import * as emailService from '../services/emailService.js';
import EmailLog from '../models/EmailLog.js';

// 1. Get Status Endpoint
export const getStatus = async (req, res) => {
  try {
    const status = await emailService.getEmailStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// 2. Schedule Endpoint (For manual testing via API)
export const scheduleManually = async (req, res) => {
  try {
    const { templateName, email, data, sendAt } = req.body;
    const result = await emailService.scheduleEmail(templateName, email, data, sendAt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Webhook Endpoint (For SendGrid/Mailgun later)
export const handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    // NOTE: This logic depends on your provider. 
    // Example for SendGrid/Mailtrap generic webhook:
    const { email_id, event_type } = event; 

    console.log('Webhook received:', event);

    if (email_id) {
       await EmailLog.findByIdAndUpdate(email_id, { status: event_type });
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Webhook failed');
  }
};