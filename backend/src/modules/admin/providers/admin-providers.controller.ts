import { Request, Response } from 'express';
import { AdminProviderService } from './admin-providers.service';
import { HttpResponse } from '@http/response';
import { param } from '@utils';

export class AdminProviderController {
  static async listPending(_req: Request, res: Response) {
    const providers = await AdminProviderService.listPending();
    return HttpResponse.success(res, providers, 'Pending providers fetched');
  }

  static async getDetail(req: Request, res: Response) {
    const detail = await AdminProviderService.getDetail(param(req, 'id'));
    return HttpResponse.success(res, detail, 'Provider detail fetched');
  }

  static async approve(req: Request, res: Response) {
    const provider = await AdminProviderService.approve(param(req, 'id'));
    return HttpResponse.success(res, provider, 'Provider approved');
  }

  static async reject(req: Request, res: Response) {
    const provider = await AdminProviderService.reject(param(req, 'id'));
    return HttpResponse.success(res, provider, 'Provider rejected');
  }
}
