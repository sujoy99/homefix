import { Model } from 'objection';
import { JobStatus, ServiceAddress } from './job.types';

export class Job extends Model {
  static tableName = 'jobs';

  id!: string;
  resident_id!: string;
  provider_id!: string | null;
  category_id!: string;
  status!: JobStatus;
  title!: string | null;
  description!: string;
  voice_note_url!: string | null;
  media_urls!: string[];
  service_address!: ServiceAddress;
  service_lat!: number | null;
  service_lon!: number | null;
  estimated_budget!: number | string | null; // written as number, read back as string by pg
  square_footage!: number | string | null;   // written as number, read back as string by pg
  created_at!: string;
  updated_at!: string;

  static relationMappings = {
    resident: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'jobs.resident_id', to: 'users.id' },
    },
    provider: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'jobs.provider_id', to: 'users.id' },
    },
    category: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../categories/category.model').Category,
      join: { from: 'jobs.category_id', to: 'categories.id' },
    },
  };
}
