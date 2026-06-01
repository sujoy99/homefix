import { Request, Response } from 'express';
import { reviewService } from './review.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { CreateReviewDTO } from './review.dto';
import { param } from '@utils';

export class ReviewController {
  static async submitReview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const jobId = param(req, 'jobId');
    const dto = req.body as CreateReviewDTO;
    const review = await reviewService.submitReview(req.user.sub, jobId, dto);
    return HttpResponse.success(res, review, 'Review submitted', 201);
  }

  static async listProviderReviews(req: Request, res: Response): Promise<Response> {
    const providerId = param(req, 'providerId');
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 10);
    const { items, total } = await reviewService.getProviderReviews(providerId, page, limit);
    return HttpResponse.paginated(res, items, page, limit, total, 'Provider reviews');
  }
}
