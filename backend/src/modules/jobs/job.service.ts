import { transaction } from 'objection';
import { JobRepository } from './job.repository';
import { PaymentRepository } from '@modules/payments/payment.repository';
import { CategoryRepository } from '@modules/categories/category.repository';
import { ProviderRepository } from '@modules/providers/provider.repository';
import { Job, CreateJobInput, JobFeedQuery } from './job.types';
import { JobStatus, isValidJobTransition } from '@homefix/shared';
import { UserStatus, UserRole } from '@modules/users/user.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '@errors/http-errors';
import { AppError } from '@errors/app-error';
import { ErrorCode } from '@errors/error-code';
import { UserRepository } from '@modules/users/user.repository';
import { Job as JobModel } from './job.model';
import { storageService } from '@modules/storage/storage.service';
import { ProfileCompletionService } from '@modules/users/profile-completion.service';
import { notificationService } from '@modules/notifications/notification.service';
import { NotificationType } from '@modules/notifications/notification.types';
import { logger } from '@logger/logger';

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
    const payment = job.status === JobStatus.AWAITING_PAYMENT
      ? await PaymentRepository.findByJobId(id)
      : undefined;
    return { ...job, payment_status: payment?.status ?? null } as unknown as Job;
  }

  static async getResidentJobs(residentId: string): Promise<Job[]> {
    const jobs = await JobRepository.findByResident(residentId);
    const awaitingIds = jobs
      .filter((j) => j.status === JobStatus.AWAITING_PAYMENT)
      .map((j) => j.id);
    const paymentMap = await PaymentRepository.findByJobIds(awaitingIds);
    return jobs.map((j) => ({
      ...j,
      payment_status: paymentMap[j.id]?.status ?? null,
    })) as unknown as Job[];
  }

  static async getProviderAssignedJobs(providerId: string): Promise<Job[]> {
    const jobs = await JobRepository.findByProvider(providerId);
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

    const completion = await ProfileCompletionService.compute(providerId, UserRole.PROVIDER);
    if (!completion.meets_threshold) {
      logger.warn(`Provider ${providerId} blocked: profile ${completion.percentage}% < threshold`);
      throw new AppError(
        'Complete your profile to accept jobs',
        403,
        ErrorCode.PROFILE_INCOMPLETE,
        undefined,
        {
          percentage: completion.percentage,
          threshold: completion.threshold,
          missing_items: completion.missing_items.map((i) => i.key),
        }
      );
    }

    // Transaction: status change + provider assignment must be atomic
    const updated = await transaction(JobModel.knex(), async (trx) => {
      return JobRepository.updateStatus(jobId, JobStatus.ACTIVE, providerId, trx);
    });

    notificationService.send({
      userId: job.resident_id,
      type: NotificationType.JOB_ACCEPTED,
      title: { en: 'Provider Accepted Your Job', bn: 'প্রভাইডার আপনার কাজ গ্রহণ করেছে' },
      body: { en: 'A provider has accepted your job request and is on the way.', bn: 'একজন প্রভাইডার আপনার কাজের অনুরোধ গ্রহণ করেছে।' },
      data: { job_id: jobId },
    }).catch((err: unknown) => logger.warn(`acceptJob notification failed: ${String(err)}`));

    return updated as unknown as Job;
  }

  static async addJobMedia(
    jobId: string,
    residentId: string,
    files: Express.Multer.File[]
  ): Promise<Job> {
    const job = await JobService.getById(jobId);

    if (job.resident_id !== residentId) {
      throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'You do not own this job');
    }

    const existingCount = Array.isArray(job.media_urls) ? job.media_urls.length : 0;
    if (existingCount + files.length > 10) {
      throw new BadRequestError(
        ErrorCode.VALIDATION_ERROR,
        `Cannot upload more than 10 media files per job (already has ${existingCount})`
      );
    }

    // Upload files to storage first (external — cannot be rolled back on DB failure)
    const uploadedUrls = await Promise.all(
      files.map((f) => storageService.save(f.buffer, f.originalname, f.mimetype).then((r) => r.url))
    );

    // Atomically append URLs into jobs.media_urls JSONB array
    return transaction(JobModel.knex(), async (trx) => {
      const updated = await JobRepository.appendMediaUrls(jobId, uploadedUrls, trx);
      return updated as unknown as Job;
    });
  }

  static async setVoiceNote(
    jobId: string,
    residentId: string,
    file: Express.Multer.File
  ): Promise<Job> {
    const job = await JobService.getById(jobId);

    if (job.resident_id !== residentId) {
      throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'You do not own this job');
    }

    const { url } = await storageService.save(file.buffer, file.originalname, file.mimetype);

    return transaction(JobModel.knex(), async (trx) => {
      const updated = await JobRepository.setVoiceNote(jobId, url, trx);
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

    // Transaction: atomic status transition
    const updated = await transaction(JobModel.knex(), async (trx) => {
      return JobRepository.updateStatus(jobId, JobStatus.AWAITING_PAYMENT, undefined, trx);
    });

    notificationService.send({
      userId: job.resident_id,
      type: NotificationType.JOB_COMPLETED,
      title: { en: 'Work Completed — Payment Required', bn: 'কাজ সম্পন্ন — পেমেন্ট প্রয়োজন' },
      body: { en: 'Your provider has completed the work. Please proceed to payment.', bn: 'আপনার প্রভাইডার কাজ সম্পন্ন করেছে। অনুগ্রহ করে পেমেন্ট করুন।' },
      data: { job_id: jobId },
    }).catch((err: unknown) => logger.warn(`completeJob notification failed: ${String(err)}`));

    return updated as unknown as Job;
  }
}
