import { locationService } from '../../services/location.service';

jest.mock('../../api/client', () => ({
  apiClient: {
    put: jest.fn(),
    get: jest.fn(),
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

const LAT = 23.8103;
const LON = 90.4125;
const JOB_ID = 'job-uuid-abc-123';

// ─── updateMyLocation ─────────────────────────────────────────────────────────

describe('locationService.updateMyLocation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends PUT to /v2/providers/me/location with latitude and longitude', async () => {
    apiClient.put.mockReturnValue(mockResponse({ latitude: LAT, longitude: LON }));

    await locationService.updateMyLocation(LAT, LON);

    expect(apiClient.put).toHaveBeenCalledWith('/v2/providers/me/location', {
      latitude: LAT,
      longitude: LON,
    });
  });

  it('resolves void on success', async () => {
    apiClient.put.mockReturnValue(mockResponse({ latitude: LAT, longitude: LON }));

    const result = await locationService.updateMyLocation(LAT, LON);

    expect(result).toBeUndefined();
  });

  it('rejects on 401 (unauthenticated)', async () => {
    apiClient.put.mockReturnValue(mockApiError(401, 'UNAUTHORIZED'));

    await expect(locationService.updateMyLocation(LAT, LON)).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it('rejects on 403 (non-provider caller)', async () => {
    apiClient.put.mockReturnValue(mockApiError(403, 'FORBIDDEN'));

    await expect(locationService.updateMyLocation(LAT, LON)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

// ─── getProviderLocation ──────────────────────────────────────────────────────

describe('locationService.getProviderLocation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends GET to /v2/jobs/:id/provider-location', async () => {
    apiClient.get.mockReturnValue(mockResponse({ latitude: LAT, longitude: LON }));

    await locationService.getProviderLocation(JOB_ID);

    expect(apiClient.get).toHaveBeenCalledWith(`/v2/jobs/${JOB_ID}/provider-location`);
  });

  it('returns { latitude, longitude } from response body', async () => {
    apiClient.get.mockReturnValue(mockResponse({ latitude: LAT, longitude: LON }));

    const result = await locationService.getProviderLocation(JOB_ID);

    expect(result).toEqual({ latitude: LAT, longitude: LON });
  });

  it('rejects on 403 (resident does not own job)', async () => {
    apiClient.get.mockReturnValue(mockApiError(403, 'JOB_ACCESS_DENIED'));

    await expect(locationService.getProviderLocation(JOB_ID)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('rejects on 404 (provider location not yet available)', async () => {
    apiClient.get.mockReturnValue(mockApiError(404, 'RESOURCE_NOT_FOUND'));

    await expect(locationService.getProviderLocation(JOB_ID)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
