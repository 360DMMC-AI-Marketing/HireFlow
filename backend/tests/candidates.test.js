import { jest } from '@jest/globals';
import { connectTestDb, disconnectTestDb, cleanDb, createTestUser, createTestJob, createTestCandidate } from './helpers.js';
import Candidate from '../models/candidate.js';

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
beforeEach(async () => { await cleanDb(); });

describe('Candidate - Model', () => {
  test('should create candidate with required fields', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);

    expect(candidate.name).toBeDefined();
    expect(candidate.email).toBeDefined();
    expect(candidate.status).toBe('New');
    expect(candidate.jobId.toString()).toBe(job._id.toString());
  });

  test('should default status to New', async () => {
    const candidate = await Candidate.create({
      name: 'Default Status',
      email: 'default@test.com'
    });
    expect(candidate.status).toBe('New');
  });

  test('should default source to HireFlow Direct', async () => {
    const candidate = await Candidate.create({
      name: 'Default Source',
      email: 'source@test.com'
    });
    expect(candidate.source).toBe('HireFlow Direct');
  });

  test('should default matchScore to 0', async () => {
    const candidate = await Candidate.create({
      name: 'No Score',
      email: 'noscore@test.com'
    });
    expect(candidate.matchScore).toBe(0);
  });

  test('should reject invalid email format', async () => {
    await expect(Candidate.create({
      name: 'Bad Email',
      email: 'not-an-email'
    })).rejects.toThrow();
  });

  test('should reject invalid status', async () => {
    await expect(Candidate.create({
      name: 'Bad Status',
      email: 'bad@test.com',
      status: 'InvalidStatus'
    })).rejects.toThrow();
  });

  test('should reject invalid source', async () => {
    await expect(Candidate.create({
      name: 'Bad Source',
      email: 'badsrc@test.com',
      source: 'InvalidSource'
    })).rejects.toThrow();
  });

  test('should reject matchScore above 100', async () => {
    await expect(Candidate.create({
      name: 'Over Score',
      email: 'over@test.com',
      matchScore: 150
    })).rejects.toThrow();
  });

  test('should reject matchScore below 0', async () => {
    await expect(Candidate.create({
      name: 'Under Score',
      email: 'under@test.com',
      matchScore: -10
    })).rejects.toThrow();
  });
});

describe('Candidate - Duplicate Prevention', () => {
  test('should reject duplicate email+jobId combo', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    await Candidate.create({
      name: 'First',
      email: 'same@test.com',
      jobId: job._id
    });

    await expect(Candidate.create({
      name: 'Second',
      email: 'same@test.com',
      jobId: job._id
    })).rejects.toThrow();
  });

  test('should allow same email for different jobs', async () => {
    const { user } = await createTestUser();
    const job1 = await createTestJob(user._id, { title: 'Job 1' });
    const job2 = await createTestJob(user._id, { title: 'Job 2' });

    const c1 = await Candidate.create({ name: 'Same Person', email: 'multi@test.com', jobId: job1._id });
    const c2 = await Candidate.create({ name: 'Same Person', email: 'multi@test.com', jobId: job2._id });

    expect(c1._id).not.toEqual(c2._id);
  });
});

describe('Candidate - CRUD Operations', () => {
  test('should fetch all candidates', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    await createTestCandidate(job._id);
    await createTestCandidate(job._id);

    const all = await Candidate.find();
    expect(all).toHaveLength(2);
  });

  test('should fetch candidate by ID', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id, { name: 'Find Me' });

    const found = await Candidate.findById(candidate._id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Find Me');
  });

  test('should update candidate', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);

    const updated = await Candidate.findByIdAndUpdate(
      candidate._id,
      { name: 'Updated Name', matchScore: 85 },
      { new: true }
    );

    expect(updated.name).toBe('Updated Name');
    expect(updated.matchScore).toBe(85);
  });

  test('should delete candidate', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);

    await Candidate.findByIdAndDelete(candidate._id);
    const found = await Candidate.findById(candidate._id);
    expect(found).toBeNull();
  });

  test('should filter by status', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    await createTestCandidate(job._id, { status: 'New' });
    await createTestCandidate(job._id, { status: 'Interview' });
    await createTestCandidate(job._id, { status: 'New' });

    const newCandidates = await Candidate.find({ status: 'New' });
    expect(newCandidates).toHaveLength(2);
  });

  test('should filter by jobId', async () => {
    const { user } = await createTestUser();
    const job1 = await createTestJob(user._id, { title: 'Job A' });
    const job2 = await createTestJob(user._id, { title: 'Job B' });
    await createTestCandidate(job1._id);
    await createTestCandidate(job1._id);
    await createTestCandidate(job2._id);

    const job1Candidates = await Candidate.find({ jobId: job1._id });
    expect(job1Candidates).toHaveLength(2);
  });

  test('should search by name', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    await createTestCandidate(job._id, { name: 'Alice Johnson' });
    await createTestCandidate(job._id, { name: 'Bob Smith' });

    const results = await Candidate.find({ name: { $regex: 'alice', $options: 'i' } });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alice Johnson');
  });
});

describe('Candidate - Status Pipeline', () => {
  const validStatuses = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'Applied'];

  test.each(validStatuses)('should accept status: %s', async (status) => {
    const candidate = await Candidate.create({
      name: `Status ${status}`,
      email: `${status.toLowerCase()}@test.com`,
      status
    });
    expect(candidate.status).toBe(status);
  });

  test('should transition through pipeline stages', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const candidate = await createTestCandidate(job._id);

    expect(candidate.status).toBe('New');

    const stages = ['Screening', 'Interview', 'Offer', 'Hired'];
    for (const stage of stages) {
      const updated = await Candidate.findByIdAndUpdate(
        candidate._id,
        { status: stage },
        { new: true }
      );
      expect(updated.status).toBe(stage);
    }
  });
});

describe('Candidate - Skills and Data', () => {
  test('should store skills array', async () => {
    const candidate = await Candidate.create({
      name: 'Skilled Person',
      email: 'skills@test.com',
      skills: ['React', 'Node.js', 'MongoDB']
    });

    expect(candidate.skills).toHaveLength(3);
    expect(candidate.skills).toContain('React');
  });

  test('should store experience array', async () => {
    const candidate = await Candidate.create({
      name: 'Experienced',
      email: 'exp@test.com',
      experience: [{
        title: 'Developer',
        company: 'TechCo',
        startDate: '2020-01',
        endDate: '2023-06',
        description: 'Built stuff'
      }]
    });

    expect(candidate.experience).toHaveLength(1);
    expect(candidate.experience[0].company).toBe('TechCo');
  });

  test('should store education array', async () => {
    const candidate = await Candidate.create({
      name: 'Educated',
      email: 'edu@test.com',
      education: [{
        degree: 'BS Computer Science',
        institution: 'MIT',
        year: '2020'
      }]
    });

    expect(candidate.education).toHaveLength(1);
    expect(candidate.education[0].institution).toBe('MIT');
  });

  test('should store red flags', async () => {
    const candidate = await Candidate.create({
      name: 'Flagged',
      email: 'flags@test.com',
      redFlags: ['Employment gap', 'Inconsistent dates']
    });

    expect(candidate.redFlags).toHaveLength(2);
  });
});

describe('Candidate - Bulk Operations', () => {
  test('should bulk update status', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const c1 = await createTestCandidate(job._id);
    const c2 = await createTestCandidate(job._id);
    const c3 = await createTestCandidate(job._id);

    const result = await Candidate.updateMany(
      { _id: { $in: [c1._id, c2._id] } },
      { $set: { status: 'Rejected' } }
    );

    expect(result.modifiedCount).toBe(2);

    const unchanged = await Candidate.findById(c3._id);
    expect(unchanged.status).toBe('New');
  });

  test('should bulk delete', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    const c1 = await createTestCandidate(job._id);
    const c2 = await createTestCandidate(job._id);

    await Candidate.deleteMany({ _id: { $in: [c1._id, c2._id] } });

    const remaining = await Candidate.find();
    expect(remaining).toHaveLength(0);
  });
});

describe('Candidate - Sorting', () => {
  test('should sort by matchScore descending', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    await createTestCandidate(job._id, { matchScore: 40 });
    await createTestCandidate(job._id, { matchScore: 90 });
    await createTestCandidate(job._id, { matchScore: 65 });

    const sorted = await Candidate.find().sort({ matchScore: -1 });
    expect(sorted[0].matchScore).toBe(90);
    expect(sorted[1].matchScore).toBe(65);
    expect(sorted[2].matchScore).toBe(40);
  });

  test('should sort by createdAt descending', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);
    await createTestCandidate(job._id, { name: 'First' });
    await createTestCandidate(job._id, { name: 'Second' });

    const sorted = await Candidate.find().sort({ createdAt: -1 });
    expect(sorted[0].name).toBe('Second');
  });
});