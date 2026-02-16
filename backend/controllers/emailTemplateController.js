// backend/controllers/emailTemplateController.js
import  EmailTemplate from '../models/EmailTemplate.js';

// 1. Create a new Template
export const createTemplate = async (req, res) => {
  try {
    const { name, subject, bodyHtml, variables } = req.body;
    
    // Check if name exists
    const existing = await EmailTemplate.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }

    const template = await EmailTemplate.create(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Templates
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Single Template by Name (Useful for the email sender)
export const getTemplateByName = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({ name: req.params.name });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Update Template
export const updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Delete Template
export const deleteTemplate = async (req, res) => {
  try {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export default {
  createTemplate,
  getAllTemplates,
  getTemplateByName,
  updateTemplate,
  deleteTemplate
};