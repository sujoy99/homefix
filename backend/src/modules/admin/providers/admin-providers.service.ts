import { User } from '@modules/users/user.model';
import { UserStatus, UserRole } from '@modules/users/user.types';
import { ProviderRepository } from '@modules/providers/provider.repository';
import { NotFoundError, BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

const SAFE_USER_COLUMNS = [
  'id', 'full_name', 'mobile', 'email', 'nid', 'status', 'created_at',
  'photo_url', 'nid_photo_url', 'nid_photo_back_url',
] as const;

export class AdminProviderService {
  static async listPending(): Promise<Pick<User, typeof SAFE_USER_COLUMNS[number]>[]> {
    return User.query()
      .select(SAFE_USER_COLUMNS)
      .where({ role: UserRole.PROVIDER, status: UserStatus.PENDING })
      .orderBy('created_at', 'asc') as unknown as Pick<User, typeof SAFE_USER_COLUMNS[number]>[];
  }

  static async getDetail(userId: string): Promise<Record<string, unknown>> {
    const user = await User.query()
      .select(SAFE_USER_COLUMNS)
      .findById(userId);
    if (!user || user.role !== UserRole.PROVIDER) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider not found');
    }

    const profile = await ProviderRepository.findByUserIdWithCategories(userId);

    return {
      ...user,
      bio: profile?.bio ?? null,
      skills: (profile?.skills ?? []).map((s) => ({
        id: s.id,
        category_id: s.category_id,
        category_name: (s as unknown as { category?: { name: string; name_bn: string | null } }).category?.name ?? null,
        category_name_bn: (s as unknown as { category?: { name_bn: string | null } }).category?.name_bn ?? null,
      })),
    };
  }

  static async approve(userId: string): Promise<User> {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider not found');
    }
    if (user.role !== UserRole.PROVIDER) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, 'User is not a provider');
    }
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, 'Provider is already approved');
    }

    const updated = await User.query().patchAndFetchById(userId, { status: UserStatus.ACTIVE });
    return updated;
  }

  static async reject(userId: string): Promise<User> {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider not found');
    }
    if (user.role !== UserRole.PROVIDER) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, 'User is not a provider');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestError(ErrorCode.BAD_REQUEST, 'Provider is already rejected');
    }

    const updated = await User.query().patchAndFetchById(userId, { status: UserStatus.INACTIVE });
    return updated;
  }
}
