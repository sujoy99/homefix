import { jobService } from '../../services/job.service';
import { JobStatus } from '@homefix/shared';
import { buildJob, buildActiveJob } from '../factories/job.factory';

jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require('../../api/client');

function mockResponse<T>(data: T) {
  return Promise.resolve({ data: { status: 'success', body: data } });
}

function mockApiError(errorCode: string, status = 400) {
  const err = Object.assign(new Error('API Error'), {
    response: { status, data: { error_code: errorCode, message: errorCode } },
  });
  return Promise.reject(err);
}

describe('jobService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createJob ─────────────────────────────────────────────────────────────

  it('createJob posts to /v2/jobs and returns the created job', async () => {
    const created = buildJob();
    apiClient.post.mockReturnValue(mockResponse(created));

    const result = await jobService.createJob({
      category_id: created.category_id,
      description: created.description,
      service_address: created.service_address,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/jobs', expect.objectContaining({
      category_id: created.category_id,
      description: created.description,
    }));
    expect(result.id).toBe(created.id);
    expect(result.status).toBe(JobStatus.PENDING);
  });

  it('createJob includes optional fields when provided', async () => {
    const created = buildJob({ estimated_budget: 2000, square_footage: 500 });
    apiClient.post.mockReturnValue(mockResponse(created));

    await jobService.createJob({
      category_id: created.category_id,
      description: created.description,
      service_address: created.service_address,
      estimated_budget: 2000,
      square_footage: 500,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v2/jobs', expect.objectContaining({
      estimated_budget: 2000,
      square_footage: 500,
    }));
  });

  // ── getMyJobs ─────────────────────────────────────────────────────────────

  it('getMyJobs fetches from /v2/jobs and returns array', async () => {
    const jobs = [buildJob(), buildJob(), buildActiveJob()];
    apiClient.get.mockReturnValue(mockResponse(jobs));

    const result = await jobService.getMyJobs();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/jobs');
    expect(result).toHaveLength(3);
    expect(result[2].status).toBe(JobStatus.ACTIVE);
  });

  // ── getJobById ────────────────────────────────────────────────────────────

  it('getJobById fetches correct endpoint', async () => {
    const job = buildJob();
    apiClient.get.mockReturnValue(mockResponse(job));

    const result = await jobService.getJobById(job.id);

    expect(apiClient.get).toHaveBeenCalledWith(`/v2/jobs/${job.id}`);
    expect(result.id).toBe(job.id);
  });

  // ── getProviderFeed ───────────────────────────────────────────────────────

  it('getProviderFeed passes lat/lon params to /v2/jobs/feed', async () => {
    const jobs = [buildJob(), buildJob()];
    apiClient.get.mockReturnValue(mockResponse(jobs));

    const result = await jobService.getProviderFeed({ lat: 23.8, lon: 90.4, limit: 20 });

    expect(apiClient.get).toHaveBeenCalledWith('/v2/jobs/feed', {
      params: { lat: 23.8, lon: 90.4, limit: 20 },
    });
    expect(result).toHaveLength(2);
  });

  it('getProviderFeed works without location params', async () => {
    apiClient.get.mockReturnValue(mockResponse([]));

    const result = await jobService.getProviderFeed();

    expect(apiClient.get).toHaveBeenCalledWith('/v2/jobs/feed', { params: undefined });
    expect(result).toEqual([]);
  });

  // ── acceptJob ─────────────────────────────────────────────────────────────

  it('acceptJob patches the correct endpoint and returns ACTIVE job', async () => {
    const job = buildActiveJob();
    apiClient.patch.mockReturnValue(mockResponse(job));

    const result = await jobService.acceptJob(job.id);

    expect(apiClient.patch).toHaveBeenCalledWith(`/v2/jobs/${job.id}/accept`);
    expect(result.status).toBe(JobStatus.ACTIVE);
  });

  it('acceptJob propagates INVALID_STATE_TRANSITION error', async () => {
    apiClient.patch.mockReturnValue(mockApiError('INVALID_STATE_TRANSITION'));

    await expect(jobService.acceptJob('some-id')).rejects.toMatchObject({
      response: { data: { error_code: 'INVALID_STATE_TRANSITION' } },
    });
  });

  // ── completeJob ───────────────────────────────────────────────────────────

  it('completeJob patches /complete and returns AWAITING_PAYMENT job', async () => {
    const job = buildJob({ status: 'awaiting_payment' as JobStatus, provider_id: 'p-1' });
    apiClient.patch.mockReturnValue(mockResponse(job));

    const result = await jobService.completeJob(job.id);

    expect(apiClient.patch).toHaveBeenCalledWith(`/v2/jobs/${job.id}/complete`);
    expect(result.status).toBe('awaiting_payment');
  });
});
