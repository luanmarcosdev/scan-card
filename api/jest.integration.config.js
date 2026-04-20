const { createDefaultPreset } = require('ts-jest');

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  transform: createDefaultPreset().transform,
  testMatch: ['**/test/integration/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/test/integration/jest.setup.ts'],
  testTimeout: 15000,
};
