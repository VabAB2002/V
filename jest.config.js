/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'app/actions/**/*.ts',
    'lib/engine/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'test-results/coverage',
  testTimeout: 30000,
  verbose: true,
};

module.exports = config;

