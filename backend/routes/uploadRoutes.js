const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { Queue } = require('bullmq');

// 1. S3 Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `resumes/${Date.now()}_${file.originalname}`);
    }
  })
});

// 2. Queue Setup
const resumeQueue = new Queue('resume-processing', {
  connection: { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 }
});

// 3. The Endpoint
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Add to Queue
    await resumeQueue.add('analyze', {
      fileUrl: req.file.location, // S3 URL
      s3Key: req.file.key,
      jobId: req.body.jobId // Passed from frontend
    });

    res.status(200).json({ 
      message: 'Resume uploaded. Parsing in progress...', 
      fileUrl: req.file.location 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;