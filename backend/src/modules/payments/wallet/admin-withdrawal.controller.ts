import { Response } from 'express';
import { WalletService } from './wallet.service';
import { WithdrawalRepository } from './withdrawal.repository';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { param } from '@utils';
import type { CompleteWithdrawalBody, RejectWithdrawalBody } from './wallet.schema';

export class AdminWithdrawalController {
  static async list(_req: AuthenticatedRequest, res: Response): Promise<Response> {
    const withdrawals = await WithdrawalRepository.listAll();
    return HttpResponse.success(res, withdrawals, 'Withdrawal requests retrieved');
  }

  static async complete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as CompleteWithdrawalBody;
    const withdrawal = await WalletService.completeWithdrawal(param(req, 'id'), req.user.sub, data);
    return HttpResponse.success(res, withdrawal, 'Withdrawal marked as completed');
  }

  static async reject(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { admin_note } = req.body as RejectWithdrawalBody;
    const withdrawal = await WalletService.rejectWithdrawal(param(req, 'id'), req.user.sub, admin_note);
    return HttpResponse.success(res, withdrawal, 'Withdrawal rejected');
  }
}
