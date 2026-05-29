import { Response } from 'express';
import { JobService } from './job.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { CreateJobDTO } from './job.dto';
import { param } from '@utils';

export class JobController {
  static async createJob(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as CreateJobDTO;
    const job = await JobService.createJob(req.user.sub, data);
    return HttpResponse.success(res, job, 'Job created', 201);
  }

  static async getMyJobs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobs = await JobService.getResidentJobs(req.user.sub);
    return HttpResponse.success(res, jobs, 'Jobs fetched');
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const job = await JobService.getById(param(req, 'id'));
    return HttpResponse.success(res, job, 'Job fetched');
  }

  static async getProviderFeed(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { limit, cursor } = req.query as { limit?: string; cursor?: string };
    const feedQuery: import('./job.types').JobFeedQuery = {};
    if (limit) feedQuery.limit = parseInt(limit, 10);
    if (cursor) feedQuery.cursor = cursor;
    const jobs = await JobService.getProviderFeed(req.user.sub, feedQuery);
    return HttpResponse.success(res, jobs, 'Job feed fetched');
  }

  static async acceptJob(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const job = await JobService.acceptJob(param(req, 'id'), req.user.sub);
    return HttpResponse.success(res, job, 'Job accepted');
  }

  static async completeJob(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const job = await JobService.completeJob(param(req, 'id'), req.user.sub);
    return HttpResponse.success(res, job, 'Job marked as complete');
  }
}
