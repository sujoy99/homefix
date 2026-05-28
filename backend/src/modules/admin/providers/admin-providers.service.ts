import { User } from '@modules/users/user.model';
import { UserStatus, UserRole } from '@modules/users/user.types';
import { NotFoundError, BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

export class AdminProviderService {
  static async listPending(): Promise<User[]> {
    return User.query()
      .where({ role: UserRole.PROVIDER, status: UserStatus.PENDING })
      .orderBy('created_at', 'asc');
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
