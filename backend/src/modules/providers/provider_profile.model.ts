import { Model } from 'objection';
import { ProviderSkillModel } from './provider_skill.model';

export class ProviderProfileModel extends Model {
  static tableName = 'provider_profiles';

  id!: string;
  user_id!: string;
  bio!: string | null;
  experience_years!: number;
  hourly_rate!: number | string | null; // written as number, read back as string by pg
  is_available!: boolean;
  rating_avg!: string;
  total_reviews!: number;
  created_at!: string;
  updated_at!: string;

  skills?: ProviderSkillModel[];

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('../users/user.model').User,
      join: { from: 'provider_profiles.user_id', to: 'users.id' },
    },
    skills: {
      relation: Model.HasManyRelation,
      modelClass: require('./provider_skill.model').ProviderSkillModel,
      join: { from: 'provider_profiles.id', to: 'provider_skills.provider_id' },
    },
  };
}
