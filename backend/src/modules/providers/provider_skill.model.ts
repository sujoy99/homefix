import { Model } from 'objection';

export class ProviderSkillModel extends Model {
  static tableName = 'provider_skills';

  id!: string;
  provider_id!: string;
  category_id!: string;
  is_primary!: boolean;
  created_at!: string;
  updated_at!: string;

  static relationMappings = {
    profile: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('./provider_profile.model').ProviderProfileModel,
      join: { from: 'provider_skills.provider_id', to: 'provider_profiles.id' },
    },
    category: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../categories/category.model').Category,
      join: { from: 'provider_skills.category_id', to: 'categories.id' },
    },
  };
}
