import { Model } from 'objection';

export class Review extends Model {
  static tableName = 'reviews';

  id!: string;
  job_id!: string;
  resident_id!: string;
  provider_id!: string;
  rating!: number;
  comment!: string | null;
  created_at!: string;

  static relationMappings = {
    resident: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'reviews.resident_id', to: 'users.id' },
    },
    provider: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'reviews.provider_id', to: 'users.id' },
    },
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../jobs/job.model').Job,
      join: { from: 'reviews.job_id', to: 'jobs.id' },
    },
  };
}
