export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  // Use a separate test database
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js'
};