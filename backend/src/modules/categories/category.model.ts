import { Model } from 'objection';

export class Category extends Model {
  static tableName = 'categories';

  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  icon_url!: string | null;
  requires_area!: boolean;
  is_active!: boolean;
  sort_order!: number;
  created_at!: string;
  updated_at!: string;
}
