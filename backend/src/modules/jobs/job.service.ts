import { transaction } from 'objection';
import { JobRepository } from './job.repository';
import { CategoryRepository } from '@modules/categories/category.repository';
import { ProviderRepository } from '@modules/providers/provider.repository';
import { Job, CreateJobInput, JobFeedQuery } from './job.types';
import { JobStatus, isValidJobTransition } from '@homefix/shared';
import { UserStatus } from '@modules/users/user.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { UserRepository } from '@modules/users/user.repository';
import { Job as JobModel } from './job.model';

export class JobService {
  static async createJob(
    residentId: string,
    data: Omit<CreateJobInput, 'resident_id'>
  ): Promise<Job> {
    const category = await CategoryRepository.findById(data.category_id);
    if (!category) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Category not found');
    }

    if (category.requires_area && !data.square_footage) {
      throw new BadRequestError(
        ErrorCode.SQUARE_FOOTAGE_REQUIRED,
        'Square footage is required for this service category'
      );
    }

    // Transaction: HF-033 will insert media records here in the same transaction
    return transaction(JobModel.knex(), async (trx) => {
      const job = await JobRepository.create({ ...data, resident_id: residentId }, trx);
      return job as unknown as Job;
    });
  }

  static async getById(id: string): Promise<Job> {
    const job = await JobRepository.findById(id);
    if (!job) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Job not found');
    }
    return job as unknown as Job;
  }

  static async getResidentJobs(residentId: string): Promise<Job[]> {
    const jobs = await JobRepository.findByResident(residentId);
    return jobs as unknown as Job[];
  }

  static async getProviderFeed(providerId: string, query: JobFeedQuery): Promise<Job[]> {
    const profile = await ProviderRepository.findByUserId(providerId);
    if (!profile || !profile.skills?.length) {
      return [];
    }
    const categoryIds = profile.skills.map((s) => s.category_id);
    const jobs = await JobRepository.findProviderFeed(categoryIds, query);
    return jobs as unknown as Job[];
  }

  static async acceptJob(jobId: string, providerId: string): Promise<Job> {
    const job = await JobService.getById(jobId);

    if (!isValidJobTransition(job.status, JobStatus.ACTIVE)) {
      throw new BadRequestError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `Cannot transition job from ${job.status} to ${JobStatus.ACTIVE}`
      );
    }

    const provider = await UserRepository.findById(providerId);
    if (!provider || provider.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError(
        ErrorCode.PROVIDER_NOT_ELIGIBLE,
        'Your account must be active to accept jobs'
      );
    }

    const profile = await ProviderRepository.findByUserId(providerId);
    const hasSkill = profile?.skills?.some((s) => s.category_id === job.category_id);
    if (!hasSkill) {
      throw new ForbiddenError(
        ErrorCode.PROVIDER_NOT_ELIGIBLE,
        'You do not have the required skill for this job'
      );
    }

    // Transaction: status change + provider assignment must be atomic
    return transaction(JobModel.knex(), async (trx) => {
      const updated = await JobRepository.updateStatus(jobId, JobStatus.ACTIVE, providerId, trx);
      return updated as unknown as Job;
    });
  }

  static async completeJob(jobId: string, providerId: string): Promise<Job> {
    const job = await JobService.getById(jobId);

    if (job.provider_id !== providerId) {
      throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'You are not assigned to this job');
    }

    if (!isValidJobTransition(job.status, JobStatus.AWAITING_PAYMENT)) {
      throw new BadRequestError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `Cannot transition job from ${job.status} to ${JobStatus.AWAITING_PAYMENT}`
      );
    }

    // Transaction: payment trigger will be added here in HF-Sprint6
    return transaction(JobModel.knex(), async (trx) => {
      const updated = await JobRepository.updateStatus(jobId, JobStatus.AWAITING_PAYMENT, undefined, trx);
      return updated as unknown as Job;
    });
  }
}
