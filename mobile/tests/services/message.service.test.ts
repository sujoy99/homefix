import { messageService } from '../../services/message.service';
import type { ImagePickerAsset } from 'expo-image-picker';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  SERVER_ROOT: 'http://localhost:4000',
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(body: T) {
  return Promise.resolve({ data: { status: 'success', body } });
}

function buildMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-1',
    job_id: 'job-1',
    sender_id: 'user-1',
    content: 'Hello',
    type: 'text',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('messageService.list', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches /v2/jobs/:id/messages with default limit=50', async () => {
    const items = [buildMessage()];
    apiClient.get.mockReturnValue(mockResponse({ items, next_cursor: null }));

    const result = await messageService.list('job-1');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v2/jobs/job-1/messages?limit=50',
    );
    expect(result.items).toEqual(items);
    expect(result.next_cursor).toBeNull();
  });

  it('appends before cursor when provided', async () => {
    apiClient.get.mockReturnValue(mockResponse({ items: [], next_cursor: null }));

    await messageService.list('job-1', 'cursor-uuid');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v2/jobs/job-1/messages?limit=50&before=cursor-uuid',
    );
  });

  it('returns next_cursor when more messages exist', async () => {
    const items = [buildMessage(), buildMessage({ id: 'msg-2' })];
    apiClient.get.mockReturnValue(mockResponse({ items, next_cursor: 'msg-1' }));

    const result = await messageService.list('job-1');

    expect(result.next_cursor).toBe('msg-1');
    expect(result.items).toHaveLength(2);
  });
});

describe('messageService.send', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts text message with type text by default', async () => {
    const msg = buildMessage({ content: 'Hey there', type: 'text' });
    apiClient.post.mockReturnValue(mockResponse(msg));

    const result = await messageService.send('job-1', 'Hey there');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/jobs/job-1/messages',
      { content: 'Hey there', type: 'text' },
    );
    expect(result.content).toBe('Hey there');
    expect(result.type).toBe('text');
  });

  it('posts image message with type image', async () => {
    const msg = buildMessage({ content: '/uploads/img.jpg', type: 'image' });
    apiClient.post.mockReturnValue(mockResponse(msg));

    const result = await messageService.send('job-1', '/uploads/img.jpg', 'image');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/jobs/job-1/messages',
      { content: '/uploads/img.jpg', type: 'image' },
    );
    expect(result.type).toBe('image');
  });

  it('posts audio message with type audio', async () => {
    const msg = buildMessage({ content: '/uploads/voice.m4a', type: 'audio' });
    apiClient.post.mockReturnValue(mockResponse(msg));

    const result = await messageService.send('job-1', '/uploads/voice.m4a', 'audio');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/jobs/job-1/messages',
      { content: '/uploads/voice.m4a', type: 'audio' },
    );
    expect(result.type).toBe('audio');
  });

  it('returns the full message object from the API', async () => {
    const msg = buildMessage({ id: 'returned-id', sender_id: 'user-42' });
    apiClient.post.mockReturnValue(mockResponse(msg));

    const result = await messageService.send('job-1', 'Hello');

    expect(result.id).toBe('returned-id');
    expect(result.sender_id).toBe('user-42');
  });
});

describe('messageService.uploadImage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts to /v2/storage/upload as multipart and returns the url', async () => {
    apiClient.post.mockReturnValue(
      mockResponse({ url: '/uploads/img.jpg', key: 'img.jpg' }),
    );

    const asset = {
      uri: 'file:///tmp/img.jpg',
      fileName: 'img.jpg',
      mimeType: 'image/jpeg',
    } as ImagePickerAsset;

    const url = await messageService.uploadImage(asset);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/storage/upload',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );
    expect(url).toBe('/uploads/img.jpg');
  });

  it('falls back to audio/mp4 mime type when mimeType is absent', async () => {
    apiClient.post.mockReturnValue(
      mockResponse({ url: '/uploads/voice.m4a', key: 'voice.m4a' }),
    );

    const asset = {
      uri: 'file:///tmp/voice.m4a',
      fileName: 'voice.m4a',
      mimeType: undefined,
    } as unknown as ImagePickerAsset;

    const url = await messageService.uploadImage(asset);

    expect(url).toBe('/uploads/voice.m4a');
  });
});
