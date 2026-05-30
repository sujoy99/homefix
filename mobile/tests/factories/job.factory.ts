import { JobStatus } from '@homefix/shared';
import type { Job, ServiceAddress } from '../../services/job.service';

let _seq = 0;
function seq() { return ++_seq; }

function buildAddress(overrides: Partial<ServiceAddress> = {}): ServiceAddress {
  const n = seq();
  return {
    house: `House ${n}`,
    flat: `Flat ${n}A`,
    road: `Road ${n}`,
    area: `Mirpur-${n}`,
    ...overrides,
  };
}

export function buildJob(overrides: Partial<Job> = {}): Job {
  const n = seq();
  return {
    id: `job-${n}`,
    resident_id: `resident-${n}`,
    provider_id: null,
    category_id: `cat-${n}`,
    status: JobStatus.PENDING,
    title: `Test Job ${n}`,
    description: `Description for job ${n} with enough detail here.`,
    voice_note_url: null,
    media_urls: [],
    service_address: buildAddress(),
    service_lat: 23.8041,
    service_lon: 90.4152,
    estimated_budget: 1500,
    square_footage: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function buildActiveJob(overrides: Partial<Job> = {}): Job {
  const n = seq();
  return buildJob({
    status: JobStatus.ACTIVE,
    provider_id: `provider-${n}`,
    ...overrides,
  });
}

export function buildAwaitingPaymentJob(overrides: Partial<Job> = {}): Job {
  const n = seq();
  return buildJob({
    status: JobStatus.AWAITING_PAYMENT,
    provider_id: `provider-${n}`,
    ...overrides,
  });
}

export function buildPaidJob(overrides: Partial<Job> = {}): Job {
  const n = seq();
  return buildJob({
    status: JobStatus.PAID,
    provider_id: `provider-${n}`,
    ...overrides,
  });
}
