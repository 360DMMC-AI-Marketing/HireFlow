# Resume Worker Setup Guide

This worker processes resume uploads asynchronously using BullMQ queue system.

## Prerequisites

### 1. Install Redis

The worker uses Redis for job queue management. Choose one option:

#### Option A: Windows (Using WSL2 - Recommended)
```bash
# Install WSL2 if you haven't
wsl --install

# Inside WSL2:
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### Option B: Windows (Using MSI Installer)
Download from: https://github.com/tporadowski/redis/releases

#### Option C: Docker (All Platforms)
```bash
docker run -d -p 6379:6379 redis:alpine
```

#### Option D: Redis Cloud (Free Tier)
Sign up at: https://redis.com/try-free/

### 2. Get Google Gemini API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 3. Configure Environment Variables

Edit `backend/.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini AI
GEMINI_API_KEY=your_actual_api_key_here
```

## Running the Worker

### Development Mode
```bash
# From backend directory
node workers/resumeWorker.js
```

### Production Mode (with PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start workers/resumeWorker.js --name resume-worker

# View logs
pm2 logs resume-worker

# Stop worker
pm2 stop resume-worker
```

## How It Works

1. **Job Creation**: When a resume is uploaded via `/api/candidates/apply`, a job is added to the queue
2. **Worker Processing**: The worker picks up the job and:
   - Downloads the resume file
   - Extracts text from PDF/DOCX
   - Sends to Gemini AI for analysis
   - Creates candidate record in database
3. **Results**: Candidate appears in dashboard with AI-parsed information

## Troubleshooting

### Error: "ECONNREFUSED localhost:6379"
- Redis is not running. Start Redis service.
- Check Redis is listening on port 6379: `redis-cli ping` (should return "PONG")

### Error: "GEMINI_API_KEY is not set"
- Add your Gemini API key to `.env` file
- Make sure the key is valid at https://aistudio.google.com/

### Error: "Cannot find module"
- Run `npm install` in the backend directory
- Packages needed: `bullmq`, `ioredis`, `pdf-parse`, `mammoth`, `@google/generative-ai`

## Testing Without Redis (Optional)

If you want to process resumes synchronously without queue:
1. Comment out BullMQ integration in the upload endpoint
2. Call `analyzeResume()` and `extractText()` directly in the route handler
3. Note: This will block the API request until processing completes

## Monitoring

View queue status using BullMQ Board:
```bash
npm install -g bull-board
bull-board
```

Or use Redis Commander:
```bash
npm install -g redis-commander
redis-commander
```
