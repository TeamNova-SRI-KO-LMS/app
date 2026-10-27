// Jest configuration for the SRI-KO LMS API.
//
// Every suite runs against a real MongoDB (mongodb-memory-server), never against the
// database configured in backend/.env: dotenv is replaced by a no-op module, and each
// Jest worker gets its own throwaway database so test files can run in parallel.
module.exports = {
  testEnvironment: 'node',
  // The root is the whole backend (not just tests/) so files that no test loads
  // still appear in the coverage report instead of silently raising the figure.
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/coverage/', '<rootDir>/uploads/'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFiles: ['<rootDir>/tests/setup/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/database.js'],
  moduleNameMapper: {
    '^dotenv$': '<rootDir>/tests/mocks/dotenv.js',
  },
  testTimeout: 30000,
  collectCoverageFrom: [
    'app.js',
    'server.js',
    'config/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    'socket/**/*.js',
    'utils/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'json-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 75,
      branches: 65,
    },
  },
};
