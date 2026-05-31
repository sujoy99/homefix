import { transaction } from 'objection';
import { ProviderRepository } from './provider.repository';
import { CategoryRepository } from '@modules/categories/category.repository';
import { ProviderProfileModel } from './provider_profile.model';
import { CreateProviderProfileInput, UpdateProviderProfileInput, AddSkillInput, ProviderProfileWithSkills } from './provider.types';
import { NotFoundError, DuplicateError, ForbiddenError, UnauthorizedError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { UserRole } from '@modules/users/user.types';
import { User } from '@modules/users/user.model';

export class ProviderService {
  static async getOrCreateProfile(userId: string, role: UserRole): Promise<ProviderProfileWithSkills> {
    if (role !== UserRole.PROVIDER) {
      throw new ForbiddenError(ErrorCode.FORBIDDEN, 'Only providers can have a profile');
    }

    let profile = await ProviderRepository.findByUserId(userId);
    if (!profile) {
      profile = await ProviderRepository.create({ user_id: userId });
      profile = await ProviderRepository.findByUserId(userId) ?? profile;
    }
    return profile as unknown as ProviderProfileWithSkills;
  }

  static async getProfileByUserId(userId: string): Promise<ProviderProfileWithSkills> {
    const profile = await ProviderRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
    }
    return profile as unknown as ProviderProfileWithSkills;
  }

  static async updateProfile(userId: string, role: UserRole, data: UpdateProviderProfileInput): Promise<ProviderProfileWithSkills> {
    const { photo_url, latitude, longitude, ...profileData } = data;

    const existing = await ProviderRepository.findByUserId(userId);

    await transaction(ProviderProfileModel.knex(), async (trx) => {
      // Update users table if photo or location changed
      const userPatch: Record<string, unknown> = {};
      if (photo_url !== undefined) userPatch.photo_url = photo_url;
      if (latitude !== undefined && longitude !== undefined) {
        userPatch.area = User.knex().raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
          [longitude, latitude]
        );
      }
      if (Object.keys(userPatch).length > 0) {
        await User.query(trx).patchAndFetchById(userId, userPatch as never);
      }

      // Update provider_profiles
      if (!existing) {
        if (role !== UserRole.PROVIDER) {
          throw new ForbiddenError(ErrorCode.FORBIDDEN, 'Only providers can have a profile');
        }
        const created = await ProviderRepository.create({ user_id: userId }, trx);
        const patched = await ProviderRepository.update(created.id, profileData, trx);
        if (!patched) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
      } else {
        const updated = await ProviderRepository.update(existing.id, profileData, trx);
        if (!updated) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
      }
    });

    return ProviderRepository.findByUserId(userId) as unknown as Promise<ProviderProfileWithSkills>;
  }

  static async addSkill(userId: string, data: AddSkillInput): Promise<ProviderProfileWithSkills> {
    const profile = await ProviderRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
    }

    const category = await CategoryRepository.findById(data.category_id);
    if (!category) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Category not found');
    }

    const existing = await ProviderRepository.findSkill(profile.id, data.category_id);
    if (existing) {
      throw new DuplicateError(ErrorCode.ALREADY_EXISTS, 'Skill already added for this category');
    }

    await ProviderRepository.addSkill(profile.id, data);
    return ProviderRepository.findByUserId(userId) as unknown as Promise<ProviderProfileWithSkills>;
  }

  static async removeSkill(userId: string, skillId: string): Promise<void> {
    const profile = await ProviderRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
    }

    const skill = await ProviderRepository.findSkillById(skillId);
    if (!skill) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Skill not found');
    }

    if (skill.provider_id !== profile.id) {
      throw new ForbiddenError(ErrorCode.FORBIDDEN, 'Skill does not belong to this provider');
    }

    await ProviderRepository.removeSkill(skillId);
  }

  static async listAvailable(): Promise<ProviderProfileWithSkills[]> {
    return ProviderRepository.listAvailable() as unknown as Promise<ProviderProfileWithSkills[]>;
  }

  static async listAvailableNearby(
    lat: number,
    lon: number,
    radiusKm: number,
    categoryId?: string
  ): Promise<ProviderProfileWithSkills[]> {
    return ProviderRepository.listAvailableNearby(
      lat, lon, radiusKm, categoryId
    ) as unknown as Promise<ProviderProfileWithSkills[]>;
  }
}
