import Candidate from '../models/candidate.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for incoming email attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(__dirname, '..', 'assets', 'uploads', 'resumes'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'email-resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|msword|officedocument/;
        const ext = path.extname(file.originalname).toLowerCase();
        const extOk = /\.(pdf|doc|docx)$/.test(ext);
        const mimeOk = allowedTypes.test(file.mimetype);
        if (extOk || mimeOk) {
            return cb(null, true);
        }
        // Skip non-resume attachments silently
        cb(null, false);
    }
});

/**
 * Parse email addresses from common formats:
 *   "John Doe <john@example.com>" → { name: "John Doe", email: "john@example.com" }
 *   "john@example.com" → { name: "", email: "john@example.com" }
 */
function parseEmailAddress(raw) {
    if (!raw) return { name: '', email: '' };
    const match = raw.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
        return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim().toLowerCase() };
    }
    return { name: '', email: raw.trim().toLowerCase() };
}

/**
 * @desc    Inbound email webhook — receives parsed emails from email services
 *          (SendGrid Inbound Parse, Mailgun, Postmark, etc.)
 *          and creates candidate records.
 *
 * Expected payload (form-data or JSON):
 *   - from:    Sender email/name
 *   - to:      Recipient (your inbound address)
 *   - subject: Email subject line
 *   - text:    Plain text body
 *   - html:    HTML body (optional)
 *   - attachments / files: Resume files
 *
 *   Also supports raw JSON webhook:
 *   { from, to, subject, text, html, attachments: [{ filename, content (base64) }] }
 */
export const handleInboundEmail = async (req, res) => {
    try {
        console.log('📧 Inbound email webhook received');

        const { from, subject, text, html } = req.body;

        if (!from) {
            return res.status(400).json({ success: false, message: 'Missing "from" field' });
        }

        const sender = parseEmailAddress(from);
        console.log(`📧 From: ${sender.name} <${sender.email}>`);
        console.log(`📧 Subject: ${subject}`);

        // Try to extract a useful name from the email
        let candidateName = sender.name;
        if (!candidateName) {
            // Derive name from email: john.doe@example.com → John Doe
            const localPart = sender.email.split('@')[0] || 'Unknown';
            candidateName = localPart
                .replace(/[._-]+/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
        }

        // Try to extract phone number from email body
        const bodyText = text || (html ? html.replace(/<[^>]+>/g, ' ') : '');
        const phoneMatch = bodyText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0] : '';

        // Extract position from subject line
        let positionApplied = 'General Application';
        if (subject) {
            // Common patterns: "Application for Software Engineer", "Re: Frontend Developer Position"
            const posMatch = subject.match(/(?:application\s+for|applying\s+for|position[:\s]+|role[:\s]+|re:\s*)\s*(.+)/i);
            if (posMatch) {
                positionApplied = posMatch[1].trim();
            } else {
                positionApplied = subject.trim();
            }
        }

        // Build resume file info if attachment was uploaded
        let resumePath = null;
        let resumeFileName = null;
        if (req.file) {
            resumePath = `assets/uploads/resumes/${req.file.filename}`;
            resumeFileName = req.file.originalname;
        } else if (req.files && req.files.length > 0) {
            resumePath = `assets/uploads/resumes/${req.files[0].filename}`;
            resumeFileName = req.files[0].originalname;
        }

        // Handle base64 attachments from JSON webhooks (Postmark, etc.)
        if (!resumePath && req.body.attachments) {
            try {
                const attachments = typeof req.body.attachments === 'string'
                    ? JSON.parse(req.body.attachments)
                    : req.body.attachments;

                if (Array.isArray(attachments) && attachments.length > 0) {
                    for (const att of attachments) {
                        const ext = path.extname(att.filename || att.Name || '').toLowerCase();
                        if (['.pdf', '.doc', '.docx'].includes(ext)) {
                            const content = att.content || att.Content;
                            if (content) {
                                const { promises: fs } = await import('fs');
                                const uniqueName = `email-resume-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
                                const filePath = path.resolve(__dirname, '..', 'assets', 'uploads', 'resumes', uniqueName);
                                await fs.writeFile(filePath, Buffer.from(content, 'base64'));
                                resumePath = `assets/uploads/resumes/${uniqueName}`;
                                resumeFileName = att.filename || att.Name;
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️  Error processing email attachments:', e.message);
            }
        }

        // Check if candidate with this email already exists
        let candidate = await Candidate.findOne({ email: sender.email });
        
        if (candidate) {
            console.log(`📧 Existing candidate found: ${candidate.name} — updating`);
            // Update with new info if available
            if (resumePath) {
                candidate.resumePath = resumePath;
                candidate.resumeFileName = resumeFileName;
                candidate.processingStatus = 'Pending';
            }
            if (bodyText) {
                candidate.summary = (candidate.summary ? candidate.summary + '\n\n---\n\n' : '') +
                    `Email (${new Date().toLocaleDateString()}): ${bodyText.substring(0, 2000)}`;
            }
            await candidate.save();
        } else {
            console.log(`📧 Creating new candidate: ${candidateName} <${sender.email}>`);
            candidate = await Candidate.create({
                name: candidateName,
                email: sender.email,
                phone,
                positionApplied,
                source: 'Email',
                status: 'New',
                matchScore: 0,
                summary: bodyText ? bodyText.substring(0, 5000) : '',
                resumePath,
                resumeFileName,
                appliedDate: new Date(),
                processingStatus: resumePath ? 'Pending' : null
            });
        }

        // If we have a resume, trigger inline AI processing (fire-and-forget)
        if (resumePath) {
            try {
                const { promises: fs } = await import('fs');
                const { extractText } = await import('../utils/textExtractor.js');
                const { analyzeResume } = await import('../utils/aiService.js');

                const backendDir = path.resolve(__dirname, '..');
                const absolutePath = path.resolve(backendDir, resumePath);
                const fileBuffer = await fs.readFile(absolutePath);
                const extName = path.extname(resumeFileName || resumePath).toLowerCase();
                const mimeMap = { '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
                const mimeType = mimeMap[extName] || 'application/pdf';

                const rawText = await extractText(fileBuffer, mimeType);
                if (rawText && rawText.length >= 20) {
                    const aiData = await analyzeResume(rawText, positionApplied);
                    candidate.resumeText = rawText;
                    candidate.matchScore = aiData.matchScore || 0;
                    candidate.skills = aiData.skills || candidate.skills;
                    candidate.experience = aiData.experience || candidate.experience;
                    candidate.education = aiData.education || candidate.education;
                    candidate.aiSummary = aiData.summary || '';
                    candidate.processingStatus = 'Completed';
                    await candidate.save();
                    console.log(`✅ Email resume processed: ${candidateName} — Score: ${aiData.matchScore}%`);
                }
            } catch (err) {
                console.error('⚠️  Email resume processing failed:', err.message);
                candidate.processingStatus = 'Failed';
                await candidate.save();
            }
        }

        console.log(`✅ Email webhook processed — Candidate: ${candidate.name} (${candidate._id})`);

        res.status(200).json({
            success: true,
            message: 'Email processed successfully',
            candidate: {
                id: candidate._id,
                name: candidate.name,
                email: candidate.email
            }
        });
    } catch (error) {
        console.error('❌ Email webhook error:', error);
        res.status(500).json({ success: false, message: 'Error processing email', error: error.message });
    }
};

// Export the upload middleware for use in routes
export const emailUpload = upload;
