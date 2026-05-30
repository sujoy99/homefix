import { TransactionOrKnex } from 'objection';
import { CommissionRepository } from './commission.repository';
import { Payment } from '../payment.model';
import { PaymentRepository } from '../payment.repository';
import { RevenueLedgerRepository } from '../revenue/revenue.repository';
import { WalletService } from '../wallet/wallet.service';
import { Job } from '@modules/jobs/job.model';
import { ResolvedCommission } from '../payment.types';
import { NotFoundError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

async function resolveRate(
  categoryId: string | null,
  paymentDate: Date
): Promise<ResolvedCommission> {
  const rule = await CommissionRepository.resolveRule(categoryId, paymentDate);
  if (!rule) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'No active commission rule found');
  }
  return {
    rate: parseFloat(rule.rate),
    commissionRuleId: rule.id,
    label: rule.label,
  };
}

async function applyCommission(paymentId: string, trx: TransactionOrKnex): Promise<void> {
  const payment = await Payment.query(trx).findById(paymentId);
  if (!payment) {
    throw new NotFoundError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found');
  }

  const job = await Job.query(trx).findById(payment.job_id);
  if (!job) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Job not found');
  }

  const commission = await resolveRate(job.category_id, new Date());

  const platformFeePaisa = Math.floor(payment.amount_paisa * commission.rate);
  const providerNetPaisa = payment.amount_paisa - platformFeePaisa;

  await PaymentRepository.applyCommissionFields(
    paymentId,
    {
      commission_rate: commission.rate.toFixed(4),
      commission_rule_id: commission.commissionRuleId,
      platform_fee_paisa: platformFeePaisa,
      provider_net_paisa: providerNetPaisa,
    },
    trx
  );

  await RevenueLedgerRepository.insert(
    {
      payment_id: paymentId,
      commission_rule_id: commission.commissionRuleId,
      amount_paisa: platformFeePaisa,
    },
    trx
  );

  await WalletService.creditWallet(payment.provider_id, providerNetPaisa, payment.job_id, trx);
}

export const CommissionService = { resolveRate, applyCommission };
