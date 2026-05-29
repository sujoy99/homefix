import { getTestDb } from '../helpers/db';
import { JobStatus } from '../../src/modules/jobs/job.types';

export interface FactoryJobOptions {
  resident_id: string;
  category_id: string;
  provider_id?: string;
  status?: JobStatus;
  description?: string;
  service_address?: object;
  service_lat?: number;
  service_lon?: number;
  estimated_budget?: number;
  square_footage?: number;
  media_urls?: string[];
}

export interface FactoryJobResult {
  id: string;
  resident_id: string;
  provider_id: string | null;
  category_id: string;
  status: JobStatus;
  description: string;
}

export async function createJob(opts: FactoryJobOptions): Promise<FactoryJobResult> {
  const db = getTestDb();

  const [row] = await db('jobs')
    .insert({
      resident_id: opts.resident_id,
      category_id: opts.category_id,
      provider_id: opts.provider_id ?? null,
      status: opts.status ?? JobStatus.PENDING,
      description: opts.description ?? 'Test job description for testing purposes',
      service_address: JSON.stringify(
        opts.service_address ?? { house: '12', road: 'Test Road', area: 'Dhaka' }
      ),
      service_lat: opts.service_lat ?? 23.8103,
      service_lon: opts.service_lon ?? 90.4125,
      media_urls: JSON.stringify(opts.media_urls ?? []),
      estimated_budget: opts.estimated_budget ?? null,
      square_footage: opts.square_footage ?? null,
    })
    .returning(['id', 'resident_id', 'provider_id', 'category_id', 'status', 'description']);

  return row as FactoryJobResult;
}
