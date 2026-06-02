import { Model } from 'objection';

export class JobMessage extends Model {
  static tableName = 'job_messages';

  id!: string;
  job_id!: string;
  sender_id!: string;
  content!: string;
  type!: string;
  created_at!: string;
}
