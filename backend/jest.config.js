/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/tests/setup.global.ts',
  globalTeardown: '<rootDir>/tests/teardown.global.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@utils$': '<rootDir>/src/utils/index.ts',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@logger/(.*)$': '<rootDir>/src/logger/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@errors/(.*)$': '<rootDir>/src/errors/$1',
    '^@http/(.*)$': '<rootDir>/src/http/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  clearMocks: true,
  testTimeout: 30000,
};
