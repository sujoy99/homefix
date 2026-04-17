
import { transaction, PartialModelObject } from 'objection';
import { User } from '@modules/users/user.model';
import { UserWithAuth } from '@modules/auth/auth.types';

export class UserRepository {

    static async findUserWithAuth(identifier: string, method: string): Promise<UserWithAuth | undefined> {
      return User.query()
        .select(
          'id',
          'full_name',
          'mobile',
          'email',
          'status',
          'role'
        )
        .withGraphFetched('authAccounts')
        .modifyGraph('authAccounts', (builder) => {
          builder
            .select(
              'id',
              'auth_method',
              'password_hash',
              'failed_attempts',
              'lock_until',
              'refresh_token_version'
            )
            .where('auth_method', method);
        })
        .where((builder) => {
          if (/^[0-9]{11}$/.test(identifier)) {
            builder.where('mobile', identifier);
          } else {
            builder.where('email', identifier);
          }
        })
        .first();
    }
}