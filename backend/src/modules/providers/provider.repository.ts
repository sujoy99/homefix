import { ProviderProfileModel } from './provider_profile.model';
import { ProviderSkillModel } from './provider_skill.model';
import { CreateProviderProfileInput, UpdateProviderProfileInput, AddSkillInput } from './provider.types';

export class ProviderRepository {
  static async findByUserId(userId: string): Promise<ProviderProfileModel | undefined> {
    return ProviderProfileModel.query()
      .findOne({ user_id: userId })
      .withGraphFetched('skills');
  }

  static async findById(id: string): Promise<ProviderProfileModel | undefined> {
    return ProviderProfileModel.query()
      .findById(id)
      .withGraphFetched('skills');
  }

  static async create(data: CreateProviderProfileInput): Promise<ProviderProfileModel> {
    return ProviderProfileModel.query().insertAndFetch({
      user_id: data.user_id,
      bio: data.bio ?? null,
      experience_years: data.experience_years ?? 0,
      hourly_rate: data.hourly_rate ?? null,
      is_available: data.is_available ?? true,
    });
  }

  static async update(id: string, data: UpdateProviderProfileInput): Promise<ProviderProfileModel | undefined> {
    return ProviderProfileModel.query().patchAndFetchById(id, data);
  }

  static async findSkillById(skillId: string): Promise<ProviderSkillModel | undefined> {
    return ProviderSkillModel.query().findById(skillId);
  }

  static async findSkill(providerId: string, categoryId: string): Promise<ProviderSkillModel | undefined> {
    return ProviderSkillModel.query().findOne({ provider_id: providerId, category_id: categoryId });
  }

  static async addSkill(providerId: string, data: AddSkillInput): Promise<ProviderSkillModel> {
    if (data.is_primary) {
      await ProviderSkillModel.query()
        .patch({ is_primary: false })
        .where('provider_id', providerId);
    }
    return ProviderSkillModel.query().insertAndFetch({
      provider_id: providerId,
      category_id: data.category_id,
      is_primary: data.is_primary ?? false,
    });
  }

  static async removeSkill(skillId: string): Promise<number> {
    return ProviderSkillModel.query().deleteById(skillId);
  }

  static async listAvailable(): Promise<ProviderProfileModel[]> {
    return ProviderProfileModel.query()
      .where('is_available', true)
      .withGraphFetched('skills');
  }

  static async listAvailableNearby(
    lat: number,
    lon: number,
    radiusKm: number,
    categoryId?: string
  ): Promise<ProviderProfileModel[]> {
    const radiusMeters = radiusKm * 1000;

    const q = ProviderProfileModel.query()
      .join('users', 'provider_profiles.user_id', 'users.id')
      .where('provider_profiles.is_available', true)
      .whereNotNull('users.area')
      .whereRaw(
        'ST_DWithin(users.area, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
        [lon, lat, radiusMeters]
      )
      .orderByRaw(
        'ST_Distance(users.area, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) ASC',
        [lon, lat]
      )
      .select('provider_profiles.*')
      .withGraphFetched('skills');

    if (categoryId) {
      q.whereExists(
        ProviderSkillModel.query()
          .whereColumn('provider_skills.provider_id', 'provider_profiles.id')
          .where('category_id', categoryId)
      );
    }

    return q;
  }
}
