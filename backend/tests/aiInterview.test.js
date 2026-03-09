import { jest } from '@jest/globals';
import { connectTestDb, disconnectTestDb, cleanDb, createTestUser, createTestJob, createTestCandidate } from './helpers.js';
import AIInterviewSession from '../models/AIInterviewSession.js';

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
beforeEach(async () => { await cleanDb(); });

// Helper: create AI interview session
async function createTestSession(jobId, candidateId, overrides = {}) {
  return AIInterviewSession.create({
    jobId,
    candidateId,
    magicToken: `test_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    expiresAt: new Date(Date.now() + 7 * 86400000),
    questions: [
      { questionText: 'Tell me about yourself', questionType: 'behavioral', order: 0 },
      { questionText: 'What is React?', questionType: 'technical', order: 1 },
      { questionText: 'Why this role?', questionType: 'general', order: 2 }
    ],
    ...overrides
  });
}

describe('AI Interview - Session Creation', () => {
  test('should create session with required fields', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    expect(session.jobId.toString()).toBe(job._id.toString());
    expect(session.candidateId.toString()).toBe(candidate._id.toString());
    expect(session.status).toBe('scheduled');
    expect(session.currentState).toBe('idle');
    expect(session.questions).toHaveLength(3);
    expect(session.magicToken).toBeDefined();
  });

  test('should default status to scheduled', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    expect(session.status).toBe('scheduled');
  });

  test('should default currentState to idle', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    expect(session.currentState).toBe('idle');
  });

  test('should require jobId', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);

    await expect(AIInterviewSession.create({
      candidateId: candidate._id,
      magicToken: 'test_no_job'
    })).rejects.toThrow();
  });

  test('should require candidateId', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    await expect(AIInterviewSession.create({
      jobId: job._id,
      magicToken: 'test_no_candidate'
    })).rejects.toThrow();
  });
});

describe('AI Interview - Status Lifecycle', () => {
  test('should transition: scheduled → in-progress', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.status = 'in-progress';
    session.startedAt = new Date();
    session.currentState = 'greeting';
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.status).toBe('in-progress');
    expect(updated.currentState).toBe('greeting');
    expect(updated.startedAt).toBeDefined();
  });

  test('should transition: in-progress → completed', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id, {
      status: 'in-progress',
      startedAt: new Date(Date.now() - 600000)
    });

    session.status = 'completed';
    session.currentState = 'done';
    session.completedAt = new Date();
    session.duration = (session.completedAt - session.startedAt) / 1000;
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.status).toBe('completed');
    expect(updated.currentState).toBe('done');
    expect(updated.duration).toBeGreaterThan(0);
    expect(updated.completedAt).toBeDefined();
  });

  test('should reject invalid status', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.status = 'invalid_status';
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject invalid currentState', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.currentState = 'invalid_state';
    await expect(session.save()).rejects.toThrow();
  });

  const validStatuses = ['scheduled', 'tech-check', 'in-progress', 'completed', 'failed', 'cancelled'];
  test.each(validStatuses)('should accept status: %s', async (status) => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id, { status });

    expect(session.status).toBe(status);
  });
});

describe('AI Interview - Questions', () => {
  test('should store questions with order', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    expect(session.questions[0].questionText).toBe('Tell me about yourself');
    expect(session.questions[0].questionType).toBe('behavioral');
    expect(session.questions[0].order).toBe(0);
    expect(session.questions[2].order).toBe(2);
  });

  test('should save transcript for a question', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.questions[0].transcript = 'I am a software developer with 5 years experience.';
    session.questions[0].responseStartTime = 30;
    session.questions[0].responseEndTime = 60;
    session.questions[0].responseDuration = 30;
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.questions[0].transcript).toContain('software developer');
    expect(updated.questions[0].responseDuration).toBe(30);
  });

  test('should save question analysis scores', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.questions[0].analysis = {
      score: 75,
      communicationScore: 80,
      relevanceScore: 70,
      depthScore: 75,
      strengths: ['Clear communication'],
      concerns: ['Lacked specifics'],
      summary: 'Good response overall'
    };
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.questions[0].analysis.score).toBe(75);
    expect(updated.questions[0].analysis.strengths).toContain('Clear communication');
  });

  test('should track attention flags per question', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.questions[0].averageGazeScore = 65;
    session.questions[0].attentionFlags = ['Looked away for 5s at 0:42', 'Multiple faces detected'];
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.questions[0].averageGazeScore).toBe(65);
    expect(updated.questions[0].attentionFlags).toHaveLength(2);
  });
});

describe('AI Interview - Attention Data', () => {
  test('should store attention data points', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.attentionData = [
      { timestamp: 0, gazeScore: 90, faceDetected: true, multipleFaces: false },
      { timestamp: 1, gazeScore: 85, faceDetected: true, multipleFaces: false },
      { timestamp: 2, gazeScore: 30, faceDetected: true, multipleFaces: true }
    ];
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.attentionData).toHaveLength(3);
    expect(updated.attentionData[2].multipleFaces).toBe(true);
    expect(updated.attentionData[2].gazeScore).toBe(30);
  });

  test('should calculate overall attention score', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.overallAttentionScore = 78;
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.overallAttentionScore).toBe(78);
  });
});

describe('AI Interview - Overall Analysis', () => {
  test('should store overall analysis', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id, { status: 'completed' });

    session.overallAnalysis = {
      overallScore: 72,
      communicationScore: 80,
      technicalScore: 65,
      cultureFitScore: 70,
      strengths: ['Good communicator', 'Relevant experience'],
      concerns: ['Weak on system design'],
      recommendation: 'yes',
      summary: 'Strong candidate for junior role',
      resumeComparison: {
        consistencies: ['5 years experience matches resume'],
        discrepancies: ['Claimed React expertise but struggled'],
        additionalInsights: ['Mentioned leadership not on resume']
      }
    };
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.overallAnalysis.overallScore).toBe(72);
    expect(updated.overallAnalysis.recommendation).toBe('yes');
    expect(updated.overallAnalysis.strengths).toHaveLength(2);
    expect(updated.overallAnalysis.resumeComparison.discrepancies).toHaveLength(1);
  });

  test('should reject invalid recommendation', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.overallAnalysis = { recommendation: 'invalid' };
    await expect(session.save()).rejects.toThrow();
  });

  const validRecs = ['strong-yes', 'yes', 'maybe', 'no', 'strong-no'];
  test.each(validRecs)('should accept recommendation: %s', async (rec) => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.overallAnalysis = { recommendation: rec };
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.overallAnalysis.recommendation).toBe(rec);
  });
});

describe('AI Interview - Recordings', () => {
  test('should store recording URLs', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    session.recordings = {
      video: { url: '/uploads/recordings/test.webm', duration: 300 },
      audio: { url: '/uploads/recordings/test.mp3', duration: 300 }
    };
    await session.save();

    const updated = await AIInterviewSession.findById(session._id);
    expect(updated.recordings.video.url).toContain('test.webm');
    expect(updated.recordings.video.duration).toBe(300);
  });
});

describe('AI Interview - Queries', () => {
  test('should find sessions by jobId', async () => {
    const { user } = await createTestUser();
    const job1 = await createTestJob(user._id, { title: 'Job 1' });
    const job2 = await createTestJob(user._id, { title: 'Job 2' });
    const c1 = await createTestCandidate(job1._id);
    const c2 = await createTestCandidate(job1._id);
    const c3 = await createTestCandidate(job2._id);

    await createTestSession(job1._id, c1._id);
    await createTestSession(job1._id, c2._id);
    await createTestSession(job2._id, c3._id);

    const job1Sessions = await AIInterviewSession.find({ jobId: job1._id });
    expect(job1Sessions).toHaveLength(2);
  });

  test('should find session by magicToken', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);
    const session = await createTestSession(job._id, candidate._id);

    const found = await AIInterviewSession.findOne({ magicToken: session.magicToken });
    expect(found).toBeDefined();
    expect(found._id.toString()).toBe(session._id.toString());
  });

  test('should find completed sessions only', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const c1 = await createTestCandidate(job._id);
    const c2 = await createTestCandidate(job._id);
    const c3 = await createTestCandidate(job._id);

    await createTestSession(job._id, c1._id, { status: 'completed' });
    await createTestSession(job._id, c2._id, { status: 'scheduled' });
    await createTestSession(job._id, c3._id, { status: 'completed' });

    const completed = await AIInterviewSession.find({ status: 'completed' });
    expect(completed).toHaveLength(2);
  });

  test('should populate candidate and job refs', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id, { title: 'Populated Job' });
    const candidate = await createTestCandidate(job._id, { name: 'Populated Candidate' });
    const session = await createTestSession(job._id, candidate._id);

    const populated = await AIInterviewSession.findById(session._id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    expect(populated.candidateId.name).toBe('Populated Candidate');
    expect(populated.jobId.title).toBe('Populated Job');
  });
});