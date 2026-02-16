import express from 'express';
import * as trackingController from '../controllers/emailTrackingController.js';
// IMPORT FIX: Use curly braces to match the "export const" names
import { 
  getAllTemplates, 
  createTemplate, 
  getTemplateByName, 
  updateTemplate,
  deleteTemplate
} from '../controllers/emailTemplateController.js';

// IMPORT FIX: Import the service function
import { sendEmail } from '../services/emailService.js'; 

const router = express.Router();


// 1. GET all templates
router.get('/', getAllTemplates);

// 2. CREATE a new template
router.post('/', createTemplate);

// 3. GET a specific template by Name
router.get('/:name', getTemplateByName);

// 4. UPDATE a template
router.put('/:id', updateTemplate);

// 5. DELETE a template
router.delete('/:id', deleteTemplate);

// 6. TEST SEND ROUTE
router.post('/test-send', async (req, res) => {
  try {
    const { templateName, email, data } = req.body;
    
    if (!templateName || !email) {
      return res.status(400).json({ success: false, message: 'Missing templateName or email' });
    }

    // Call the service directly
    await sendEmail(templateName, email, data || {});
    
    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/schedule', trackingController.scheduleManually);
router.get('/status/:id', trackingController.getStatus);
router.post('/webhook', trackingController.handleWebhook);
export default router;