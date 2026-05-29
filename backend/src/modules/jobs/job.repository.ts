import { PartialModelObject, TransactionOrKnex } from 'objection';
import { Job } from './job.model';
import { JobStatus, CreateJobInput, JobFeedQuery } from './job.types';

export class JobRepository {
  static async create(data: CreateJobInput, trx?: TransactionOrKnex): Promise<Job> {
    const payload: PartialModelObject<Job> = {
      resident_id: data.resident_id,
      category_id: data.category_id,
      description: data.description,
      service_address: data.service_address,
      status: JobStatus.PENDING,
      title: data.title ?? null,
      voice_note_url: data.voice_note_url ?? null,
      media_urls: data.media_urls ?? [],
      service_lat: data.service_lat ?? null,
      service_lon: data.service_lon ?? null,
      estimated_budget: data.estimated_budget ?? null,
      square_footage: data.square_footage ?? null,
    };
    return Job.query(trx).insertAndFetch(payload);
  }

  static async findById(id: string): Promise<Job | undefined> {
    return Job.query().findById(id);
  }

  static async findByResident(residentId: string): Promise<Job[]> {
    return Job.query()
      .where('resident_id', residentId)
      .orderBy('created_at', 'desc');
  }

  static async findProviderFeed(categoryIds: string[], query: JobFeedQuery): Promise<Job[]> {
    const limit = query.limit ?? 20;

    const q = Job.query()
      .where('status', JobStatus.PENDING)
      .whereIn('category_id', categoryIds)
      .limit(limit);

    if (query.cursor) {
      q.where('created_at', '<', query.cursor);
    }

    if (query.lat !== undefined && query.lon !== undefined) {
      // Sort by distance from provider's current location — nearest jobs first
      q.orderByRaw(
        'ST_Distance(service_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) ASC NULLS LAST',
        [query.lon, query.lat]
      );
    } else {
      q.orderBy('created_at', 'desc');
    }

    return q;
  }

  static async updateStatus(
    id: string,
    status: JobStatus,
    providerId?: string,
    trx?: TransactionOrKnex
  ): Promise<Job | undefined> {
    const patch: PartialModelObject<Job> = { status };
    if (providerId !== undefined) patch.provider_id = providerId;
    return Job.query(trx).patchAndFetchById(id, patch);
  }
}
