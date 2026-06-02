import { reviewService } from '../../services/review.service';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(data: T) {
  return Promise.resolve({ data: { status: 'success', body: data } });
}

function mockApiError(status = 400, errorCode = 'ERROR') {
  const err = Object.assign(new Error('API Error'), {
    response: { status, data: { error_code: errorCode } },
  });
  return Promise.reject(err);
}

const JOB_ID = 'job-abc';
const PROVIDER_ID = 'provider-xyz';

const REVIEW_FIXTURE = {
  id: 'rev-1',
  job_id: JOB_ID,
  resident_id: 'resident-1',
  provider_id: PROVIDER_ID,
  rating: 5,
  comment: 'Great work!',
  created_at: new Date().toISOString(),
};

// ─── submitReview ─────────────────────────────────────────────────────────────

describe('reviewService.submitReview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts to /v2/jobs/:id/review with rating and comment', async () => {
    apiClient.post.mockReturnValue(mockResponse(REVIEW_FIXTURE));

    const result = await reviewService.submitReview(JOB_ID, 5, 'Great work!');

    expect(apiClient.post).toHaveBeenCalledWith(`/v2/jobs/${JOB_ID}/review`, {
      rating: 5,
      comment: 'Great work!',
    });
    expect(result.id).toBe('rev-1');
    expect(result.rating).toBe(5);
    expect(result.comment).toBe('Great work!');
  });

  it('omits comment when not provided', async () => {
    apiClient.post.mockReturnValue(mockResponse({ ...REVIEW_FIXTURE, comment: null }));

    await reviewService.submitReview(JOB_ID, 4);

    expect(apiClient.post).toHaveBeenCalledWith(`/v2/jobs/${JOB_ID}/review`, { rating: 4 });
  });

  it('omits comment when only whitespace', async () => {
    apiClient.post.mockReturnValue(mockResponse({ ...REVIEW_FIXTURE, comment: null }));

    await reviewService.submitReview(JOB_ID, 3, '   ');

    expect(apiClient.post).toHaveBeenCalledWith(`/v2/jobs/${JOB_ID}/review`, { rating: 3 });
  });

  it('rejects when job is not in PAID state (REVIEW_NOT_ALLOWED)', async () => {
    apiClient.post.mockReturnValue(mockApiError(400, 'REVIEW_NOT_ALLOWED'));

    await expect(reviewService.submitReview(JOB_ID, 5)).rejects.toMatchObject({
      response: { data: { error_code: 'REVIEW_NOT_ALLOWED' } },
    });
  });

  it('rejects when review already exists (REVIEW_ALREADY_EXISTS)', async () => {
    apiClient.post.mockReturnValue(mockApiError(409, 'REVIEW_ALREADY_EXISTS'));

    await expect(reviewService.submitReview(JOB_ID, 5)).rejects.toMatchObject({
      response: { data: { error_code: 'REVIEW_ALREADY_EXISTS' } },
    });
  });

  it('rejects on unauthenticated request', async () => {
    apiClient.post.mockReturnValue(mockApiError(401, 'UNAUTHORIZED'));

    await expect(reviewService.submitReview(JOB_ID, 5)).rejects.toThrow();
  });
});

// ─── getProviderReviews ───────────────────────────────────────────────────────

describe('reviewService.getProviderReviews', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gets /v2/providers/:id/reviews with default page and limit', async () => {
    const payload = {
      items: [REVIEW_FIXTURE],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    apiClient.get.mockReturnValue(mockResponse(payload));

    const result = await reviewService.getProviderReviews(PROVIDER_ID);

    expect(apiClient.get).toHaveBeenCalledWith(`/v2/providers/${PROVIDER_ID}/reviews`, {
      params: { page: 1, limit: 10 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('passes custom page and limit params', async () => {
    const payload = {
      items: [],
      pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
    };
    apiClient.get.mockReturnValue(mockResponse(payload));

    await reviewService.getProviderReviews(PROVIDER_ID, 2, 5);

    expect(apiClient.get).toHaveBeenCalledWith(`/v2/providers/${PROVIDER_ID}/reviews`, {
      params: { page: 2, limit: 5 },
    });
  });

  it('returns empty items list when provider has no reviews', async () => {
    const payload = {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
    apiClient.get.mockReturnValue(mockResponse(payload));

    const result = await reviewService.getProviderReviews(PROVIDER_ID);

    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('rejects on API error', async () => {
    apiClient.get.mockReturnValue(mockApiError(404, 'RESOURCE_NOT_FOUND'));

    await expect(reviewService.getProviderReviews(PROVIDER_ID)).rejects.toThrow();
  });
});
