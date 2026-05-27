import 'react-native-gesture-handler/jestSetup';

// Silence noisy RN warnings in test output
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Reset secure store between tests
beforeEach(async () => {
  const secureStore = await import('expo-secure-store');
  (secureStore as any).__reset?.();
  jest.clearAllMocks();
});
