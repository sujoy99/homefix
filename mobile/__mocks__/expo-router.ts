export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};

export const useRouter = jest.fn(() => router);
export const useLocalSearchParams = jest.fn(() => ({}));
export const useSegments = jest.fn(() => []);
export const Link = 'Link';
export const Redirect = 'Redirect';
export const Stack = { Screen: 'Screen' };
export const Tabs = { Screen: 'Screen' };
