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

// 3. Webhook Endpoint — handles events from SendGrid, Mailgun, Postmark, or generic providers
//
// SendGrid sends an array of event objects with fields like:
//   { email, event: "delivered"|"open"|"bounce"|"dropped", sg_message_id, timestamp }
//
// Mailgun sends a single event object:
//   { event-data: { event: "delivered"|"opened"|"failed", recipient, timestamp } }
//
// This handler normalizes both formats and updates EmailLog records.
export const handleWebhook = async (req, res) => {
  try {
    // Normalize incoming payload into an array of events
    let events = [];

    if (Array.isArray(req.body)) {
      // SendGrid format: array of event objects
      events = req.body.map(e => ({
        email: e.email,
        eventType: e.event,        // delivered, open, bounce, dropped, click
        emailId: e.email_id,       // custom field we may set
        messageId: e.sg_message_id,
        timestamp: e.timestamp ? new Date(e.timestamp * 1000) : new Date()
      }));
    } else if (req.body['event-data']) {
      // Mailgun format: single event wrapper
      const e = req.body['event-data'];
      events = [{
        email: e.recipient,
        eventType: e.event,         // delivered, opened, failed, complained
        emailId: e['user-variables']?.emailId,
        messageId: e.message?.headers?.['message-id'],
        timestamp: e.timestamp ? new Date(e.timestamp * 1000) : new Date()
      }];
    } else if (req.body.email_id || req.body.event_type) {
      // Generic / Postmark / custom format
      events = [{
        email: req.body.email || req.body.to,
        eventType: req.body.event_type || req.body.event,
        emailId: req.body.email_id,
        messageId: req.body.message_id,
        timestamp: new Date()
      }];
    }

    if (events.length === 0) {
      console.log('Webhook received but no parsable events:', JSON.stringify(req.body).substring(0, 200));
      return res.status(200).send('OK');
    }

    let processed = 0;

    for (const event of events) {
      // Try to find the EmailLog entry
      let emailLog = null;

      if (event.emailId) {
        emailLog = await EmailLog.findById(event.emailId).catch(() => null);
      }
      if (!emailLog && event.email) {
        // Fallback: find most recent log to this recipient
        emailLog = await EmailLog.findOne({ to: event.email }).sort({ createdAt: -1 });
      }

      if (!emailLog) continue;

      // Map provider event names to our status updates
      const eventType = (event.eventType || '').toLowerCase();

      if (['delivered', 'delivery'].includes(eventType)) {
        emailLog.status = 'sent';
        emailLog.deliveredAt = event.timestamp;
      } else if (['open', 'opened'].includes(eventType)) {
        emailLog.openedAt = event.timestamp;
      } else if (['bounce', 'bounced', 'hard_bounce', 'soft_bounce'].includes(eventType)) {
        emailLog.status = 'failed';
        emailLog.bouncedAt = event.timestamp;
        emailLog.error = `Bounced: ${eventType}`;
      } else if (['dropped', 'failed', 'complained', 'spam'].includes(eventType)) {
        emailLog.status = 'failed';
        emailLog.error = `Provider event: ${eventType}`;
      } else if (['click', 'clicked'].includes(eventType)) {
        // Track clicks if needed in the future
        emailLog.clickedAt = event.timestamp;
      }

      await emailLog.save();
      processed++;
    }

    console.log(`📧 Webhook processed ${processed}/${events.length} events`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Always return 200 to webhooks to prevent retries
    res.status(200).send('Error logged');
  }
};