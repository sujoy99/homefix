import { Response } from 'express';
import { JobService } from './job.service';
import { HttpResponse } from '@http/response';
import { BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { CreateJobDTO } from './job.dto';
import { JobFeedQuery } from './job.types';
import { param } from '@utils';

type MulterRequest = AuthenticatedRequest & {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
};

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

  static async getMyAssignedJobs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobs = await JobService.getProviderAssignedJobs(req.user.sub);
    return HttpResponse.success(res, jobs, 'Assigned jobs fetched');
  }

  static async getProviderFeed(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { limit, cursor, lat, lon } = req.query as {
      limit?: string; cursor?: string; lat?: string; lon?: string;
    };
    const feedQuery: JobFeedQuery = {};
    if (limit) feedQuery.limit = parseInt(limit, 10);
    if (cursor) feedQuery.cursor = cursor;
    if (lat) feedQuery.lat = parseFloat(lat);
    if (lon) feedQuery.lon = parseFloat(lon);
    const jobs = await JobService.getProviderFeed(req.user.sub, feedQuery);
    return HttpResponse.success(res, jobs, 'Job feed fetched');
  }

  static async addJobMedia(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const files = (req as MulterRequest).files;
    if (!files?.length) {
      throw new BadRequestError(ErrorCode.VALIDATION_ERROR, 'No files uploaded');
    }
    const job = await JobService.addJobMedia(param(req, 'id'), req.user.sub, files);
    return HttpResponse.success(res, job, 'Media uploaded');
  }

  static async setVoiceNote(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const file = (req as MulterRequest).file;
    if (!file) {
      throw new BadRequestError(ErrorCode.VALIDATION_ERROR, 'No file uploaded');
    }
    const job = await JobService.setVoiceNote(param(req, 'id'), req.user.sub, file);
    return HttpResponse.success(res, job, 'Voice note saved');
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
