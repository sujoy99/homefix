import { Response } from 'express';
import { MfsAccountService } from './mfs-account.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { param } from '@utils';
import type { CreateMfsAccountBody } from './wallet.schema';

export class MfsAccountController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const accounts = await MfsAccountService.listAccounts(req.user.sub);
    return HttpResponse.success(res, accounts, 'Payment accounts retrieved');
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as CreateMfsAccountBody;
    const account = await MfsAccountService.createAccount(req.user.sub, data);
    return HttpResponse.success(res, account, 'Payment account added', 201);
  }

  static async setPrimary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const account = await MfsAccountService.setPrimary(req.user.sub, param(req, 'id'));
    return HttpResponse.success(res, account, 'Primary account updated');
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    await MfsAccountService.deleteAccount(req.user.sub, param(req, 'id'));
    return HttpResponse.success(res, null, 'Payment account removed');
  }
}
