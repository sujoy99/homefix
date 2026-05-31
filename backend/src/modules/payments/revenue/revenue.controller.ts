import { Response } from 'express';
import { RevenueService } from './revenue.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import type { RevenueDashboardQuery, RevenueJobsQuery } from './revenue.schema';

export class RevenueController {
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const query = req.query as unknown as RevenueDashboardQuery;
    const dashboard = await RevenueService.getDashboard(query);
    return HttpResponse.success(res, dashboard, 'Revenue dashboard retrieved');
  }

  static async getJobsDetail(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const query = req.query as unknown as RevenueJobsQuery;
    const result = await RevenueService.getJobsDetail(query);
    return HttpResponse.success(res, result, 'Revenue jobs detail retrieved');
  }
}
