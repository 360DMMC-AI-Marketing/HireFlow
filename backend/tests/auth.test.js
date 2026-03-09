import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectTestDb, disconnectTestDb, cleanDb, createTestUser } from './helpers.js';
import User from '../models/user.js';

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
beforeEach(async () => { await cleanDb(); });

describe('Auth - User Model', () => {
  test('should create a user with hashed password', async () => {
    const user = await User.create({
      email: 'hash@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    expect(user.email).toBe('hash@test.com');
    expect(user.password).not.toBe('TestPass123!');
    expect(user.password.startsWith('$2a$') || user.password.startsWith('$2b$')).toBe(true);
  });

  test('should compare password correctly', async () => {
    const user = await User.create({
      email: 'compare@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    const loaded = await User.findById(user._id).select('+password');
    const correct = await loaded.comparePassword('TestPass123!');
    const wrong = await loaded.comparePassword('WrongPass');

    expect(correct).toBe(true);
    expect(wrong).toBe(false);
  });

  test('should generate valid JWT token', async () => {
    const user = await User.create({
      email: 'jwt@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    const token = user.getSignedJwtToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('should generate refresh token', async () => {
    const user = await User.create({
      email: 'refresh@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    const refreshToken = user.generateRefreshToken();
    expect(refreshToken).toBeDefined();
    expect(user.refreshToken).toBe(refreshToken);
  });

  test('should generate email verification token', async () => {
    const user = await User.create({
      email: 'verify@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    const token = user.generateEmailVerificationToken();
    expect(token).toBeDefined();
    expect(user.emailVerificationToken).toBeDefined();
    expect(user.emailVerificationExpires).toBeDefined();
    expect(user.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('should generate reset password code (6 digits)', async () => {
    const user = await User.create({
      email: 'reset@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    const code = user.generateResetPasswordCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(user.resetPasswordCode).toBeDefined();
    expect(user.resetPasswordCodeExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('should reject duplicate emails', async () => {
    await User.create({
      email: 'dupe@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    await expect(User.create({
      email: 'dupe@test.com',
      password: 'TestPass456!',
      companyName: 'Test Co 2',
      industry: 'Finance',
      companySize: '11-50'
    })).rejects.toThrow();
  });

  test('should require mandatory fields', async () => {
    await expect(User.create({
      email: 'incomplete@test.com'
    })).rejects.toThrow();
  });

  test('should default role to recruiter', async () => {
    const user = await User.create({
      email: 'role@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    expect(user.role).toBe('recruiter');
  });

  test('should default isEmailVerified to false', async () => {
    const user = await User.create({
      email: 'unverified@test.com',
      password: 'TestPass123!',
      companyName: 'Test Co',
      industry: 'Technology',
      companySize: '1-10'
    });

    expect(user.isEmailVerified).toBe(false);
  });
});

describe('Auth - createTestUser helper', () => {
  test('should create verified admin user with token', async () => {
    const { user, token, password } = await createTestUser();

    expect(user.isEmailVerified).toBe(true);
    expect(user.role).toBe('admin');
    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);
    expect(password).toBe('TestPass123!');
  });

  test('should allow role override', async () => {
    const { user } = await createTestUser({ role: 'recruiter' });
    expect(user.role).toBe('recruiter');
  });
});