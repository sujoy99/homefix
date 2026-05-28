module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'store/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
};
