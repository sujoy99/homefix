import { Response } from 'express';
import { WalletService } from './wallet.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import type { RequestWithdrawalBody } from './wallet.schema';

export class WalletController {
  static async getWallet(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { wallet, transactions, nextCursor } = await WalletService.getWalletWithHistory(req.user.sub);
    return HttpResponse.success(res, { wallet, transactions, next_cursor: nextCursor }, 'Wallet retrieved');
  }

  static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const cursor = req.query['cursor'] as string | undefined;
    const { transactions, nextCursor } = await WalletService.getTransactions(req.user.sub, cursor);
    return HttpResponse.success(res, { transactions, next_cursor: nextCursor }, 'Transactions retrieved');
  }

  static async requestWithdrawal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { amount_paisa } = req.body as RequestWithdrawalBody;
    const withdrawal = await WalletService.requestWithdrawal(req.user.sub, amount_paisa);
    return HttpResponse.success(res, withdrawal, 'Withdrawal request submitted', 201);
  }
}
