import { ProviderRepository } from './provider.repository';
import { CategoryRepository } from '@modules/categories/category.repository';
import { CreateProviderProfileInput, UpdateProviderProfileInput, AddSkillInput, ProviderProfileWithSkills } from './provider.types';
import { NotFoundError, DuplicateError, ForbiddenError, UnauthorizedError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { UserRole } from '@modules/users/user.types';

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
    let profile = await ProviderRepository.findByUserId(userId);
    if (!profile) {
      if (role !== UserRole.PROVIDER) {
        throw new ForbiddenError(ErrorCode.FORBIDDEN, 'Only providers can have a profile');
      }
      profile = await ProviderRepository.create({ user_id: userId });
      profile = await ProviderRepository.findByUserId(userId) ?? profile;
    }

    const updated = await ProviderRepository.update(profile.id, data);
    if (!updated) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider profile not found');
    }

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
}
