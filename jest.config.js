/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!hooks)|@expo-google-fonts|react-navigation|@react-navigation/.*|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|drizzle-orm|burnt|gifted-charts-core|country-flag-icons)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Metro resolves this deep path directly; Jest enforces package "exports".
    '^country-flag-icons/string/3x2/index.cjs$': '<rootDir>/node_modules/country-flag-icons/string/3x2/index.cjs',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'hooks/**/*.ts',
    'providers/**/*.tsx',
    'features/**/*.{ts,tsx}',
    'components/**/*.tsx',
    'app/**/*.tsx',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
};
