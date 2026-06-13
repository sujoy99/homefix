import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from '../../hooks/useChat';
import type { Message } from '../../services/message.service';

// ── socket.io-client mock ──────────────────────────────────────────────────────
// NOTE: factory must not reference out-of-scope vars — set mockReturnValue in beforeEach.

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockIo: jest.Mock = require('socket.io-client').io;

// ── api/client mock ───────────────────────────────────────────────────────────

jest.mock('../../api/client', () => ({
  SERVER_ROOT: 'http://localhost:4000',
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

// ── messageService mock ───────────────────────────────────────────────────────

const mockList = jest.fn();
const mockSend = jest.fn();

jest.mock('../../services/message.service', () => ({
  messageService: {
    list:        (...args: unknown[]) => mockList(...args),
    send:        (...args: unknown[]) => mockSend(...args),
    uploadImage: jest.fn(),
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

let _msgCounter = 0;

function buildMessage(overrides: Partial<Message> = {}): Message {
  _msgCounter++;
  return {
    id:         `msg-${_msgCounter}`,
    job_id:     'job-1',
    sender_id:  'user-1',
    content:    `Message ${_msgCounter}`,
    type:       'text',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Per-test socket state
let eventHandlers: Record<string, (...args: unknown[]) => void>;
let mockSocketEmit: jest.Mock;
let mockSocketDisconnect: jest.Mock;

function makeMockSocket() {
  eventHandlers    = {};
  mockSocketEmit   = jest.fn();
  mockSocketDisconnect = jest.fn();

  return {
    on:         jest.fn((event: string, cb: (...a: unknown[]) => void) => { eventHandlers[event] = cb; }),
    emit:       mockSocketEmit,
    disconnect: mockSocketDisconnect,
    connected:  false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _msgCounter = 0;
    mockIo.mockReturnValue(makeMockSocket());

    mockList.mockResolvedValue({ items: [], next_cursor: null });
    mockSend.mockImplementation((_jid, content, type) =>
      Promise.resolve(buildMessage({ content: content as string, type: (type ?? 'text') as Message['type'] })),
    );
  });

  // ── initial load ────────────────────────────────────────────────────────────

  it('starts with isLoading true, then false after list resolves', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('populates messages from the initial list call', async () => {
    const msgs = [buildMessage({ content: 'Hi' }), buildMessage({ content: 'There' })];
    mockList.mockResolvedValue({ items: msgs, next_cursor: null });

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(mockList).toHaveBeenCalledWith('job-1');
  });

  it('sets hasMore true when next_cursor is returned', async () => {
    mockList.mockResolvedValue({ items: [buildMessage()], next_cursor: 'cursor-abc' });

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
  });

  it('sets hasMore false when next_cursor is null', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });

  // ── socket events ───────────────────────────────────────────────────────────

  it('emits join_job and sets isConnected on socket connect', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { eventHandlers['connect']?.(); });

    expect(mockSocketEmit).toHaveBeenCalledWith('join_job', 'job-1');
    expect(result.current.isConnected).toBe(true);
  });

  it('sets isConnected false on socket disconnect', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { eventHandlers['connect']?.(); });
    act(() => { eventHandlers['disconnect']?.(); });

    expect(result.current.isConnected).toBe(false);
  });

  it('appends incoming message from socket event', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const incoming = buildMessage({ content: 'Real-time!' });
    act(() => { eventHandlers['message']?.(incoming); });

    expect(result.current.messages[0]?.content).toBe('Real-time!');
  });

  it('does not duplicate a message if the same id arrives twice', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const msg = buildMessage({ id: 'dup' });
    act(() => { eventHandlers['message']?.(msg); });
    act(() => { eventHandlers['message']?.(msg); });

    expect(result.current.messages.filter((m) => m.id === 'dup')).toHaveLength(1);
  });

  // ── sendText ────────────────────────────────────────────────────────────────

  it('sendText calls messageService.send with type text and appends result', async () => {
    const sent = buildMessage({ content: 'hello', type: 'text' });
    mockSend.mockResolvedValue(sent);

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.sendText('hello'); });

    expect(mockSend).toHaveBeenCalledWith('job-1', 'hello', 'text');
    expect(result.current.messages.some((m) => m.id === sent.id)).toBe(true);
  });

  it('sets isSending true while sendText is in flight', async () => {
    let resolve!: (v: Message) => void;
    mockSend.mockReturnValue(new Promise<Message>((res) => { resolve = res; }));

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { void result.current.sendText('slow'); });
    expect(result.current.isSending).toBe(true);

    await act(async () => { resolve(buildMessage()); });
    expect(result.current.isSending).toBe(false);
  });

  // ── sendImage ───────────────────────────────────────────────────────────────

  it('sendImage calls messageService.send with type image', async () => {
    const sent = buildMessage({ type: 'image', content: '/uploads/img.jpg' });
    mockSend.mockResolvedValue(sent);

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.sendImage('/uploads/img.jpg'); });

    expect(mockSend).toHaveBeenCalledWith('job-1', '/uploads/img.jpg', 'image');
    expect(result.current.messages.some((m) => m.type === 'image')).toBe(true);
  });

  // ── sendAudio ───────────────────────────────────────────────────────────────

  it('sendAudio calls messageService.send with type audio', async () => {
    const sent = buildMessage({ type: 'audio', content: '/uploads/voice.m4a' });
    mockSend.mockResolvedValue(sent);

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.sendAudio('/uploads/voice.m4a'); });

    expect(mockSend).toHaveBeenCalledWith('job-1', '/uploads/voice.m4a', 'audio');
    expect(result.current.messages.some((m) => m.type === 'audio')).toBe(true);
  });

  // ── loadMore ────────────────────────────────────────────────────────────────

  it('loadMore fetches older messages with cursor and appends them', async () => {
    const first = buildMessage({ id: 'first' });
    const older = buildMessage({ id: 'older' });
    mockList
      .mockResolvedValueOnce({ items: [first], next_cursor: 'cursor-1' })
      .mockResolvedValueOnce({ items: [older], next_cursor: null });

    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(async () => { await result.current.loadMore(); });

    expect(mockList).toHaveBeenCalledWith('job-1', 'cursor-1');
    expect(result.current.messages.some((m) => m.id === 'older')).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore is a no-op when hasMore is false', async () => {
    const { result } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.loadMore(); });

    expect(mockList).toHaveBeenCalledTimes(1);
  });

  // ── cleanup ─────────────────────────────────────────────────────────────────

  it('emits leave_job and disconnects socket on unmount', async () => {
    const { unmount } = renderHook(() => useChat({ jobId: 'job-1' }));
    await waitFor(() => expect(mockList).toHaveBeenCalled());

    unmount();

    expect(mockSocketEmit).toHaveBeenCalledWith('leave_job', 'job-1');
    expect(mockSocketDisconnect).toHaveBeenCalled();
  });
});
