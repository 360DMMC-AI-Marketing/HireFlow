import 'dotenv/config';
import { Worker } from 'bullmq';
import { connectToDatabase } from '../config/database.js';
import Candidate from '../models/candidate.js';
import { extractText } from '../utils/textExtractor.js';
import { analyzeResume } from '../utils/aiService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.REDIS_HOST && !process.env.REDIS_PORT) {
  console.warn('⚠️  Redis configuration not found. Make sure Redis is running on localhost:6379');
}

// Connect to database
await connectToDatabase();

const worker = new Worker('resume-processing', async (job) => {
  console.log(`📋 Processing Job ${job.id}`);
  const { candidateId, filePath, fileName, mimeType, jobId } = job.data;

  try {
    // 1. Read file from local file system
    // Resolve path relative to backend directory (parent of workers/)
    const backendDir = path.resolve(__dirname, '..');
    const absolutePath = path.resolve(backendDir, filePath);
    console.log(`📄 Reading file: ${absolutePath}`);
    const fileBuffer = await fs.readFile(absolutePath);

    // 2. Extract Text from Resume
    console.log(`🔍 Extracting text from ${fileName}...`);
    const rawText = await extractText(fileBuffer, mimeType);
    console.log(`✅ Extracted ${rawText.length} characters`);

    if (!rawText || rawText.length < 20) {
      console.warn('⚠️  Extracted text too short, skipping AI analysis');
      await Candidate.findByIdAndUpdate(candidateId, { 
        processingStatus: 'Failed',
        resumeText: rawText || '',
        redFlags: ['Could not extract readable text from resume file. Please re-upload in a different format (PDF or DOCX).']
      });
      return { success: false, candidateId, reason: 'Text extraction yielded insufficient text' };
    }

    // 3. Fetch Job Description from Database
    let jobDescription = "General position";
    let jobTitle = "General Application";
    
    if (jobId) {
      try {
        const { default: Job } = await import('../models/job.js');
        const job = await Job.findById(jobId);
        if (job) {
          const reqs = Array.isArray(job.requirements) ? job.requirements.join('\n- ') : (job.requirements || 'Not specified');
          const skills = job.screeningCriteria?.requiredSkills?.join(', ') || '';
          jobDescription = `${job.title}\n\n${job.description}\n\nRequirements:\n- ${reqs}${skills ? `\n\nRequired Skills: ${skills}` : ''}${job.screeningCriteria?.minYearsExperience ? `\nMinimum Experience: ${job.screeningCriteria.minYearsExperience} years` : ''}`;
          jobTitle = job.title;
          console.log(`📌 Job found: ${job.title}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not fetch job: ${error.message}`);
      }
    }

    // 4. AI Analysis with Gemini
    console.log(`🤖 Analyzing resume with AI...`);
    const aiData = await analyzeResume(rawText, jobDescription);
    console.log(`✅ AI Analysis complete - Match Score: ${aiData.matchScore}%`);

    // 5. Update Candidate in DB with AI results
    const updateData = {
      resumeText: rawText,
      processingStatus: 'Completed',
      status: 'Screening',
      matchScore: aiData.matchScore || 0,
      skills: aiData.skills || [],
      experience: aiData.experience || [],
      redFlags: aiData.redFlags || []
    };
    
    // Update name if AI extracted a better one and current name is generic
    if (aiData.name && aiData.name !== '' && aiData.name !== 'Unknown') {
      updateData.name = aiData.name;
    }
    
    // Update phone if AI found one
    if (aiData.phone && aiData.phone !== '') {
      updateData.phone = aiData.phone;
    }
    
    // Update summary
    if (aiData.summary && aiData.summary !== '') {
      updateData.summary = aiData.summary;
    }
    
    // Only update email if AI found one AND it won't cause a duplicate key conflict
    if (aiData.email && aiData.email !== '' && !aiData.email.includes('placeholder')) {
      // Check if another candidate with same email+jobId already exists
      const existing = await Candidate.findOne({ 
        email: aiData.email, 
        jobId: jobId, 
        _id: { $ne: candidateId } 
      });
      if (!existing) {
        updateData.email = aiData.email;
      } else {
        console.warn(`⚠️  Skipping email update - another candidate with ${aiData.email} already exists for this job`);
      }
    }
    
    console.log(`📝 Updating candidate with match score: ${updateData.matchScore}%`);
    
    let candidate;
    try {
      candidate = await Candidate.findByIdAndUpdate(
        candidateId,
        updateData,
        { new: true }
      );
    } catch (updateErr) {
      // If duplicate key error, retry without email
      if (updateErr.code === 11000) {
        console.warn('⚠️  Duplicate key on update, retrying without email change...');
        delete updateData.email;
        candidate = await Candidate.findByIdAndUpdate(
          candidateId,
          updateData,
          { new: true }
        );
      } else {
        throw updateErr;
      }
    }

    console.log(`✅ Candidate Updated: ${candidate.name} - Score: ${candidate.matchScore}%`);
    console.log(`📊 Skills: ${candidate.skills?.join(', ') || 'None'}`);
    
    return { success: true, candidateId, matchScore: candidate.matchScore };

  } catch (error) {
    console.error(`❌ Job ${job.id} Failed:`, error);
    
    // Update candidate processing status to failed
    try {
      await Candidate.findByIdAndUpdate(candidateId, {
        processingStatus: 'Failed'
      });
    } catch (updateError) {
      console.error('Failed to update candidate status:', updateError);
    }
    
    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

console.log("✅ Worker started and waiting for jobs...");