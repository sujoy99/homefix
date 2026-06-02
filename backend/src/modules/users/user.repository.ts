
import { TransactionOrKnex, PartialModelObject } from 'objection';
import { User } from '@modules/users/user.model';
import { UserWithAuth } from '@modules/auth/auth.types';

export class UserRepository {

    static async findById(id: string): Promise<User | undefined> {
      return User.query().findById(id);
    }

    static async incrementRating(providerId: string, rating: number, trx?: TransactionOrKnex): Promise<void> {
      await User.query(trx)
        .patch({
          avg_rating: User.raw(
            'CASE WHEN avg_rating IS NULL THEN ? ELSE (avg_rating * review_count + ?) / (review_count + 1) END',
            [rating, rating]
          ),
          review_count: User.raw('review_count + 1'),
        } as PartialModelObject<User>)
        .where('id', providerId);
    }

    static async findUserWithAuth(identifier: string, method: string): Promise<UserWithAuth | undefined> {
      return User.query()
        .select(
          'id',
          'full_name',
          'mobile',
          'email',
          'status',
          'role',
          // Extract lat/lon from PostGIS geography — null when no location set
          User.raw('ST_Y(area::geometry) as home_lat'),
          User.raw('ST_X(area::geometry) as home_lon'),
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