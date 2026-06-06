/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!hooks)|@expo-google-fonts|react-navigation|@react-navigation/.*|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|drizzle-orm|burnt)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'hooks/**/*.ts',
    'services/**/*.ts',
    'components/**/*.tsx',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
};
