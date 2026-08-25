module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
};
