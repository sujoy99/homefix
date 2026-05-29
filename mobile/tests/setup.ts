import 'react-native-gesture-handler/jestSetup';

// Silence noisy RN warnings in test output
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Reset secure store between tests
// eslint-disable-next-line @typescript-eslint/no-require-imports
const secureStore = require('expo-secure-store');

beforeEach(() => {
  secureStore.__reset?.();
  jest.clearAllMocks();
});
