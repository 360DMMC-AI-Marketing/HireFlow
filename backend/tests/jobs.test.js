import { jest } from '@jest/globals';
import { connectTestDb, disconnectTestDb, cleanDb, createTestUser, createTestJob } from './helpers.js';
import Job from '../models/job.js';

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
beforeEach(async () => { await cleanDb(); });

describe('Job - Model', () => {
  test('should create a job with required fields', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    expect(job.title).toBeDefined();
    expect(job.department).toBe('Engineering');
    expect(job.employmentType).toBe('Full-time');
    expect(job.location).toBe('Remote');
    expect(job.description).toBeDefined();
    expect(job.status).toBe('Active');
    expect(job.createdBy.toString()).toBe(user._id.toString());
  });

  test('should default status to Draft', async () => {
    const job = await Job.create({
      title: 'Draft Job',
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'NYC',
      description: 'A draft job'
    });

    expect(job.status).toBe('Draft');
  });

  test('should reject invalid department', async () => {
    await expect(Job.create({
      title: 'Bad Job',
      department: 'InvalidDept',
      employmentType: 'Full-time',
      location: 'NYC',
      description: 'Test'
    })).rejects.toThrow();
  });

  test('should reject invalid employment type', async () => {
    await expect(Job.create({
      title: 'Bad Job',
      department: 'Engineering',
      employmentType: 'Freelance',
      location: 'NYC',
      description: 'Test'
    })).rejects.toThrow();
  });

  test('should reject invalid status', async () => {
    await expect(Job.create({
      title: 'Bad Job',
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'NYC',
      description: 'Test',
      status: 'InvalidStatus'
    })).rejects.toThrow();
  });

  test('should require title', async () => {
    await expect(Job.create({
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'NYC',
      description: 'No title'
    })).rejects.toThrow(/job title/i);
  });

  test('should require description', async () => {
    await expect(Job.create({
      title: 'No Desc Job',
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'NYC'
    })).rejects.toThrow();
  });
});

describe('Job - CRUD Operations', () => {
  test('should fetch all jobs', async () => {
    const { user } = await createTestUser();
    await createTestJob(user._id, { title: 'Job A' });
    await createTestJob(user._id, { title: 'Job B' });

    const jobs = await Job.find();
    expect(jobs).toHaveLength(2);
  });

  test('should fetch job by ID', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id, { title: 'Specific Job' });

    const found = await Job.findById(job._id);
    expect(found).toBeDefined();
    expect(found.title).toBe('Specific Job');
  });

  test('should update job', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    const updated = await Job.findByIdAndUpdate(
      job._id,
      { title: 'Updated Title', status: 'Paused' },
      { new: true }
    );

    expect(updated.title).toBe('Updated Title');
    expect(updated.status).toBe('Paused');
  });

  test('should delete job', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    await Job.findByIdAndDelete(job._id);
    const found = await Job.findById(job._id);
    expect(found).toBeNull();
  });

  test('should filter jobs by status', async () => {
    const { user } = await createTestUser();
    await createTestJob(user._id, { status: 'Active' });
    await createTestJob(user._id, { status: 'Draft' });
    await createTestJob(user._id, { status: 'Active' });

    const active = await Job.find({ status: 'Active' });
    expect(active).toHaveLength(2);
  });

  test('should filter jobs by department', async () => {
    const { user } = await createTestUser();
    await createTestJob(user._id, { department: 'Engineering' });
    await createTestJob(user._id, { department: 'Marketing' });

    const eng = await Job.find({ department: 'Engineering' });
    expect(eng).toHaveLength(1);
    expect(eng[0].department).toBe('Engineering');
  });

  test('should sort jobs by createdAt', async () => {
    const { user } = await createTestUser();
    const j1 = await createTestJob(user._id, { title: 'First' });
    const j2 = await createTestJob(user._id, { title: 'Second' });

    const sorted = await Job.find().sort({ createdAt: -1 });
    expect(sorted[0].title).toBe('Second');
    expect(sorted[1].title).toBe('First');
  });
});

describe('Job - Salary', () => {
  test('should store salary range', async () => {
    const job = await Job.create({
      title: 'Paid Job',
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'NYC',
      description: 'Good pay',
      salary: { min: 80000, max: 120000, currency: 'USD' }
    });

    expect(job.salary.min).toBe(80000);
    expect(job.salary.max).toBe(120000);
    expect(job.salary.currency).toBe('USD');
  });
});

describe('Job - Analytics', () => {
  test('should have default analytics values', async () => {
    const { user } = await createTestUser();
    const job = await createTestJob(user._id);

    expect(job.analytics.totalApplicants).toBe(0);
    expect(job.analytics.screenedApplicants).toBe(0);
    expect(job.analytics.interviewsScheduled).toBe(0);
  });
});

describe('Job - Screening Criteria', () => {
  test('should store screening criteria', async () => {
    const job = await Job.create({
      title: 'Screened Job',
      department: 'Engineering',
      employmentType: 'Full-time',
      location: 'Remote',
      description: 'Needs screening',
      screeningCriteria: {
        requiredSkills: ['React', 'Node.js'],
        minYearsExperience: 3,
        educationLevel: 'Bachelor'
      }
    });

    expect(job.screeningCriteria.requiredSkills).toContain('React');
    expect(job.screeningCriteria.minYearsExperience).toBe(3);
  });
});