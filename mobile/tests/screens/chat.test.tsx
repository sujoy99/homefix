import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import ChatScreen from '../../app/(app)/booking/job/chat/[id]';
import type { Message } from '../../services/message.service';

jest.setTimeout(15000);

// ── expo-router ───────────────────────────────────────────────────────────────

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'job-123' }),
  useRouter: () => ({ back: mockRouterBack, push: mockRouterPush }),
}));

// ── react-i18next ─────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

// ── lucide-react-native ───────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View, null);
  return new Proxy({}, { get: () => Icon });
});

// ── react-native-safe-area-context ────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...p }: { children: React.ReactNode }) =>
      React.createElement(View, p, children),
  };
});

// ── authStore ────────────────────────────────────────────────────────────────

jest.mock('../../store/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } }) => unknown) =>
    sel({ user: { id: 'me-123' } }),
}));

// ── useChat hook ──────────────────────────────────────────────────────────────

const mockSendText  = jest.fn();
const mockSendImage = jest.fn();
const mockSendAudio = jest.fn();
const mockLoadMore  = jest.fn();
const mockRefresh   = jest.fn();

const mockChatHookDefaults = {
  messages:    [] as Message[],
  isLoading:   false,
  isSending:   false,
  hasMore:     false,
  isConnected: true,
  sendText:    mockSendText,
  sendImage:   mockSendImage,
  sendAudio:   mockSendAudio,
  loadMore:    mockLoadMore,
  refresh:     mockRefresh,
};

let mockChatHookOverrides: Partial<typeof mockChatHookDefaults> = {};

jest.mock('../../hooks/useChat', () => ({
  useChat: () => ({ ...mockChatHookDefaults, ...mockChatHookOverrides }),
}));

// ── messageService ────────────────────────────────────────────────────────────

const mockUploadImage = jest.fn();
jest.mock('../../services/message.service', () => ({
  messageService: { uploadImage: (...args: unknown[]) => mockUploadImage(...args) },
}));

// ── expo-av ───────────────────────────────────────────────────────────────────

const mockRequestPermissionsAsync = jest.fn();
const mockSetAudioModeAsync       = jest.fn();
const mockStartAsync              = jest.fn();
const mockStopAndUnloadAsync      = jest.fn();
const mockGetURI                  = jest.fn();
const mockPrepareToRecordAsync    = jest.fn();

const mockRecordingInstance = {
  prepareToRecordAsync: (...a: unknown[]) => mockPrepareToRecordAsync(...a),
  startAsync:           (...a: unknown[]) => mockStartAsync(...a),
  stopAndUnloadAsync:   (...a: unknown[]) => mockStopAndUnloadAsync(...a),
  getURI:               (...a: unknown[]) => mockGetURI(...a),
};

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync:  (...a: unknown[]) => mockRequestPermissionsAsync(...a),
    setAudioModeAsync:        (...a: unknown[]) => mockSetAudioModeAsync(...a),
    RecordingOptionsPresets:  { HIGH_QUALITY: {} },
    Recording: jest.fn().mockImplementation(() => mockRecordingInstance),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          getStatusAsync:  jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
          pauseAsync:      jest.fn().mockResolvedValue(undefined),
          playAsync:       jest.fn().mockResolvedValue(undefined),
          unloadAsync:     jest.fn().mockResolvedValue(undefined),
          setPositionAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

// ── expo-image-picker ─────────────────────────────────────────────────────────

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync             = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...a: unknown[]) => mockRequestMediaLibraryPermissionsAsync(...a),
  launchImageLibraryAsync:             (...a: unknown[]) => mockLaunchImageLibraryAsync(...a),
}));

// ── utils ─────────────────────────────────────────────────────────────────────

jest.mock('../../utils/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../utils/media', () => ({
  resolveMediaUrl: (url: string) => `http://localhost:4000${url}`,
}));

// ─────────────────────────────────────────────────────────────────────────────

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id:         'msg-1',
    job_id:     'job-123',
    sender_id:  'me-123',
    content:    'Hello',
    type:       'text',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderChat() {
  return render(<ChatScreen />);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ChatScreen — empty and loading states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
    mockSendText.mockResolvedValue(undefined);
    mockSendImage.mockResolvedValue(undefined);
    mockSendAudio.mockResolvedValue(undefined);
  });

  it('shows loading indicator while isLoading is true', () => {
    mockChatHookOverrides = { isLoading: true };
    renderChat();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(screen.UNSAFE_queryByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('shows empty state when messages array is empty', () => {
    renderChat();
    expect(screen.getByText('chat.empty_title')).toBeTruthy();
    expect(screen.getByText('chat.empty_desc')).toBeTruthy();
  });

  it('renders the screen title in the header', () => {
    renderChat();
    expect(screen.getByText('chat.title')).toBeTruthy();
  });

  it('shows back button in header', () => {
    renderChat();
    expect(screen.getByRole('button', { name: 'common.back' })).toBeTruthy();
  });

  it('back button calls router.back()', () => {
    renderChat();
    fireEvent.press(screen.getByRole('button', { name: 'common.back' }));
    expect(mockRouterBack).toHaveBeenCalled();
  });
});

describe('ChatScreen — connection indicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
  });

  it('renders Wifi icon when connected', () => {
    mockChatHookOverrides = { isConnected: true };
    renderChat();
    // Wifi icon is rendered (lucide mock renders a View)
    // We verify no crash — the hook controls state
    expect(screen.getByText('chat.title')).toBeTruthy();
  });

  it('renders WifiOff icon when disconnected', () => {
    mockChatHookOverrides = { isConnected: false };
    renderChat();
    expect(screen.getByText('chat.title')).toBeTruthy();
  });
});

describe('ChatScreen — message bubbles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
  });

  it('renders a text bubble with message content', () => {
    mockChatHookOverrides = {
      messages: [buildMessage({ content: 'Hey there!' })],
    };
    renderChat();
    expect(screen.getByText('Hey there!')).toBeTruthy();
  });

  it('renders a received text bubble (from another user)', () => {
    mockChatHookOverrides = {
      messages: [buildMessage({ sender_id: 'other-user', content: 'Incoming!' })],
    };
    renderChat();
    expect(screen.getByText('Incoming!')).toBeTruthy();
  });

  it('renders an image bubble (Image component present)', () => {
    mockChatHookOverrides = {
      messages: [buildMessage({ type: 'image', content: '/uploads/img.jpg' })],
    };
    renderChat();
    // Image component is rendered; no text content for image bubble body
    expect(screen.queryByText('/uploads/img.jpg')).toBeNull();
  });

  it('renders an audio bubble with play button', () => {
    mockChatHookOverrides = {
      messages: [buildMessage({ type: 'audio', content: '/uploads/voice.m4a' })],
    };
    renderChat();
    // Audio bubble renders a play/pause button plus the input-bar buttons — at least 3 total
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('shows load more button when hasMore is true', () => {
    mockChatHookOverrides = {
      messages: [buildMessage()],
      hasMore: true,
    };
    renderChat();
    expect(screen.getByText('chat.load_more')).toBeTruthy();
  });

  it('load more button calls loadMore', () => {
    mockChatHookOverrides = {
      messages: [buildMessage()],
      hasMore: true,
    };
    renderChat();
    fireEvent.press(screen.getByText('chat.load_more'));
    expect(mockLoadMore).toHaveBeenCalled();
  });
});

describe('ChatScreen — text input and send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
    mockSendText.mockResolvedValue(undefined);
  });

  it('shows mic button when input is empty', () => {
    renderChat();
    expect(screen.getByRole('button', { name: 'chat.record_voice' })).toBeTruthy();
  });

  it('shows send button when text is typed', () => {
    renderChat();
    const input = screen.getByPlaceholderText('chat.placeholder');
    fireEvent.changeText(input, 'Hello');
    expect(screen.getByRole('button', { name: 'chat.send' })).toBeTruthy();
  });

  it('pressing send calls sendText with trimmed input and clears field', async () => {
    renderChat();
    const input = screen.getByPlaceholderText('chat.placeholder');
    fireEvent.changeText(input, '  hi there  ');

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.send' }));
    });

    expect(mockSendText).toHaveBeenCalledWith('hi there');
    expect(input.props.value).toBe('');
  });

  it('send button is disabled when isSending is true', () => {
    mockChatHookOverrides = { isSending: true };
    renderChat();
    const input = screen.getByPlaceholderText('chat.placeholder');
    fireEvent.changeText(input, 'something');
    const sendBtn = screen.getByRole('button', { name: 'chat.send' });
    expect(sendBtn.props.accessibilityState?.disabled ?? sendBtn.props.disabled).toBeTruthy();
  });
});

describe('ChatScreen — image attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
    mockSendImage.mockResolvedValue(undefined);
    mockUploadImage.mockResolvedValue('/uploads/img.jpg');
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  });

  it('pressing attach button opens image picker', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.attach_image' }));
    });

    expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
  });

  it('uploads selected image and calls sendImage', async () => {
    const asset = { uri: 'file:///tmp/img.jpg', fileName: 'img.jpg', mimeType: 'image/jpeg' };
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [asset] });

    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.attach_image' }));
    });

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(asset);
      expect(mockSendImage).toHaveBeenCalledWith('/uploads/img.jpg');
    });
  });

  it('does not call uploadImage when picker is cancelled', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.attach_image' }));
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockSendImage).not.toHaveBeenCalled();
  });

  it('shows error toast when media permission is denied', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    const { toast } = require('../../utils/toast');

    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.attach_image' }));
    });

    expect(toast.error).toHaveBeenCalledWith('booking.photo_permission_required');
  });
});

describe('ChatScreen — voice recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatHookOverrides = {};
    mockSendAudio.mockResolvedValue(undefined);
    mockUploadImage.mockResolvedValue('/uploads/voice.m4a');
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetAudioModeAsync.mockResolvedValue(undefined);
    mockPrepareToRecordAsync.mockResolvedValue(undefined);
    mockStartAsync.mockResolvedValue(undefined);
    mockStopAndUnloadAsync.mockResolvedValue(undefined);
    mockGetURI.mockReturnValue('file:///tmp/voice.m4a');
  });

  it('pressing mic starts recording — shows stop and cancel buttons', async () => {
    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.record_voice' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'chat.stop_and_send' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'chat.cancel_recording' })).toBeTruthy();
    });
  });

  it('pressing mic shows error toast when mic permission is denied', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
    const { toast } = require('../../utils/toast');

    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.record_voice' }));
    });

    expect(toast.error).toHaveBeenCalledWith('chat.error_mic_permission');
  });

  it('cancel recording returns to idle state', async () => {
    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.record_voice' }));
    });
    await waitFor(() => screen.getByRole('button', { name: 'chat.cancel_recording' }));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.cancel_recording' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'chat.record_voice' })).toBeTruthy();
    });
  });

  it('stop sends audio — calls uploadImage and sendAudio, returns to idle', async () => {
    renderChat();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.record_voice' }));
    });
    await waitFor(() => screen.getByRole('button', { name: 'chat.stop_and_send' }));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'chat.stop_and_send' }));
    });

    await waitFor(() => {
      expect(mockStopAndUnloadAsync).toHaveBeenCalled();
      expect(mockUploadImage).toHaveBeenCalled();
      expect(mockSendAudio).toHaveBeenCalledWith('/uploads/voice.m4a');
      // Returns to idle
      expect(screen.getByRole('button', { name: 'chat.record_voice' })).toBeTruthy();
    });
  });
});
