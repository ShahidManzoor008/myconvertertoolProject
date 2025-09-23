module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleFileExtensions: ['js', 'json', 'node'],
  // Increase default per-test timeout to accommodate slower CI/dev machines
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.js']
};
