import { TransactionOrKnex, PartialModelObject } from 'objection';
import { Review } from './review.model';
import { ReviewListItem } from './review.types';

export interface CreateReviewInput {
  job_id: string;
  resident_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
}

export class ReviewRepository {
  static async create(data: CreateReviewInput, trx?: TransactionOrKnex): Promise<Review> {
    return Review.query(trx).insertAndFetch({
      job_id: data.job_id,
      resident_id: data.resident_id,
      provider_id: data.provider_id,
      rating: data.rating,
      comment: data.comment ?? null,
    } as PartialModelObject<Review>);
  }

  static async findByJobId(jobId: string): Promise<Review | undefined> {
    return Review.query().findOne({ job_id: jobId });
  }

  static async listByProvider(
    providerId: string,
    page: number,
    limit: number
  ): Promise<ReviewListItem[]> {
    const offset = (page - 1) * limit;
    const rows = await Review.knex()
      .select(
        'reviews.id',
        'reviews.job_id',
        'reviews.resident_id',
        'reviews.rating',
        'reviews.comment',
        'reviews.created_at',
        'users.full_name as resident_name'
      )
      .from('reviews')
      .join('users', 'users.id', 'reviews.resident_id')
      .where('reviews.provider_id', providerId)
      .orderBy('reviews.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return rows as ReviewListItem[];
  }

  static async countByProvider(providerId: string): Promise<number> {
    const result = await Review.query()
      .where('provider_id', providerId)
      .count('id as count')
      .first();
    return Number((result as unknown as { count: string }).count);
  }
}
