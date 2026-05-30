import { transaction, TransactionOrKnex } from 'objection';
import { CommissionRuleScope } from '@homefix/shared';
import { CommissionRepository } from './commission.repository';
import { CommissionRule } from './commission.model';
import { Payment } from '../payment.model';
import { PaymentRepository } from '../payment.repository';
import { RevenueLedgerRepository } from '../revenue/revenue.repository';
import { WalletService } from '../wallet/wallet.service';
import { Job } from '@modules/jobs/job.model';
import { ResolvedCommission } from '../payment.types';
import { BadRequestError, NotFoundError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import type { CreateCommissionRuleBody, PatchCommissionRuleBody, PreviewCommissionQuery } from './commission.schema';

async function listRules(): Promise<CommissionRule[]> {
  return CommissionRepository.findAll();
}

async function createRule(data: CreateCommissionRuleBody, adminId: string): Promise<CommissionRule> {
  return transaction(CommissionRule.knex(), async (trx) => {
    if (data.scope === CommissionRuleScope.GLOBAL) {
      await CommissionRepository.deactivateActiveGlobal(trx);
    }
    return CommissionRepository.create(
      {
        scope: data.scope,
        rate: data.rate.toFixed(4),
        label: data.label,
        category_id: data.category_id ?? null,
        valid_from: data.valid_from ? new Date(data.valid_from) : null,
        valid_until: data.valid_until ? new Date(data.valid_until) : null,
        is_active: true,
        created_by_admin_id: adminId,
      },
      trx
    );
  });
}

async function updateRule(id: string, data: PatchCommissionRuleBody): Promise<CommissionRule> {
  const existing = await CommissionRepository.findById(id);
  if (!existing) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Commission rule not found');

  const patch: Partial<CommissionRule> = {};
  if (data.label !== undefined) patch.label = data.label;
  if (data.rate !== undefined) patch.rate = data.rate.toFixed(4);
  if ('valid_from' in data) patch.valid_from = data.valid_from ? new Date(data.valid_from) : null;
  if ('valid_until' in data) patch.valid_until = data.valid_until ? new Date(data.valid_until) : null;

  const updated = await CommissionRepository.patch(id, patch);
  if (!updated) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Commission rule not found');
  return updated;
}

async function deleteRule(id: string): Promise<void> {
  const existing = await CommissionRepository.findById(id);
  if (!existing) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Commission rule not found');
  if (!existing.is_active) throw new BadRequestError(ErrorCode.BAD_REQUEST, 'Commission rule is already inactive');
  await CommissionRepository.deactivate(id);
}

async function previewRule(query: PreviewCommissionQuery): Promise<ResolvedCommission> {
  const date = query.date ? new Date(query.date) : new Date();
  const categoryId = query.category_id ?? null;
  return resolveRate(categoryId, date);
}

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

export const CommissionService = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  previewRule,
  resolveRate,
  applyCommission,
};
