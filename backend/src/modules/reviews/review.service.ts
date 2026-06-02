import { transaction } from 'objection';
import { JobStatus } from '@homefix/shared';
import { JobRepository } from '@modules/jobs/job.repository';
import { UserRepository } from '@modules/users/user.repository';
import { ReviewRepository } from './review.repository';
import { CreateReviewDTO } from './review.dto';
import { Review, ReviewListItem } from './review.types';
import { Review as ReviewModel } from './review.model';
import { NotFoundError, BadRequestError, ForbiddenError, DuplicateError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

async function submitReview(residentId: string, jobId: string, dto: CreateReviewDTO): Promise<Review> {
  const job = await JobRepository.findById(jobId);
  if (!job) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Job not found');
  }
  if (job.resident_id !== residentId) {
    throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'You do not own this job');
  }
  if (job.status !== JobStatus.PAID) {
    throw new BadRequestError(ErrorCode.REVIEW_NOT_ALLOWED, 'Reviews can only be submitted after payment');
  }
  if (job.provider_id === null) {
    throw new BadRequestError(ErrorCode.REVIEW_NOT_ALLOWED, 'Job has no assigned provider');
  }

  const existing = await ReviewRepository.findByJobId(jobId);
  if (existing) {
    throw new DuplicateError(ErrorCode.REVIEW_ALREADY_EXISTS, 'A review already exists for this job');
  }

  const review = await transaction(ReviewModel.knex(), async (trx) => {
    const created = await ReviewRepository.create(
      {
        job_id: jobId,
        resident_id: residentId,
        provider_id: job.provider_id as string,
        rating: dto.rating,
        ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
      },
      trx
    );
    await UserRepository.incrementRating(job.provider_id as string, dto.rating, trx);
    return created;
  });

  return review as unknown as Review;
}

async function getProviderReviews(
  providerId: string,
  page: number,
  limit: number
): Promise<{ items: ReviewListItem[]; total: number }> {
  const provider = await UserRepository.findById(providerId);
  if (!provider) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Provider not found');
  }

  const [items, total] = await Promise.all([
    ReviewRepository.listByProvider(providerId, page, limit),
    ReviewRepository.countByProvider(providerId),
  ]);

  return { items, total };
}

export const reviewService = { submitReview, getProviderReviews };
