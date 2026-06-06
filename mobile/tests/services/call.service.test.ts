import { callService } from '../../services/call.service';
import type { RoomConfig } from '../../services/call.service';

jest.mock('../../api/client', () => ({
  apiClient: { post: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(body: T) {
  return Promise.resolve({ data: { status: 'success', body } });
}

function buildRoomConfig(overrides: Partial<RoomConfig> = {}): RoomConfig {
  return {
    provider: 'jitsi',
    roomName: 'homefix-job-job-1',
    serverUrl: 'https://meet.homefix.app',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('callService.createRoom', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts to /v2/jobs/:id/call/room', async () => {
    const config = buildRoomConfig();
    apiClient.post.mockReturnValue(mockResponse(config));

    await callService.createRoom('job-1');

    expect(apiClient.post).toHaveBeenCalledWith('/v2/jobs/job-1/call/room');
  });

  it('returns the RoomConfig body from the response', async () => {
    const config = buildRoomConfig({ roomName: 'homefix-job-abc', token: 'jwt-token' });
    apiClient.post.mockReturnValue(mockResponse(config));

    const result = await callService.createRoom('abc');

    expect(result.provider).toBe('jitsi');
    expect(result.roomName).toBe('homefix-job-abc');
    expect(result.token).toBe('jwt-token');
  });

  it('rejects when the API returns an error', async () => {
    apiClient.post.mockRejectedValue(new Error('Network error'));

    await expect(callService.createRoom('job-1')).rejects.toThrow('Network error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('callService.buildCallUrl', () => {
  it('builds URL from serverUrl + roomName when no token', () => {
    const config = buildRoomConfig({ serverUrl: 'https://meet.homefix.app', token: undefined });
    expect(callService.buildCallUrl(config)).toBe(
      'https://meet.homefix.app/homefix-job-job-1',
    );
  });

  it('appends token as ?jwt= query param when present', () => {
    const config = buildRoomConfig({ serverUrl: 'https://meet.homefix.app', token: 'my-jwt' });
    expect(callService.buildCallUrl(config)).toBe(
      'https://meet.homefix.app/homefix-job-job-1?jwt=my-jwt',
    );
  });

  it('falls back to meet.jit.si when serverUrl is absent', () => {
    const config = buildRoomConfig({ serverUrl: undefined, token: undefined });
    expect(callService.buildCallUrl(config)).toBe(
      'https://meet.jit.si/homefix-job-job-1',
    );
  });

  it('falls back to meet.jit.si and appends token when serverUrl absent', () => {
    const config = buildRoomConfig({ serverUrl: undefined, token: 'fallback-jwt' });
    expect(callService.buildCallUrl(config)).toBe(
      'https://meet.jit.si/homefix-job-job-1?jwt=fallback-jwt',
    );
  });

  it('works for agora provider — URL is provider-agnostic (mobile selects SDK via provider field)', () => {
    const config: RoomConfig = {
      provider: 'agora',
      roomName: 'homefix-job-xyz',
      serverUrl: 'https://agora.example.com',
      token: 'agora-rtc-token',
    };
    expect(callService.buildCallUrl(config)).toBe(
      'https://agora.example.com/homefix-job-xyz?jwt=agora-rtc-token',
    );
  });
});
