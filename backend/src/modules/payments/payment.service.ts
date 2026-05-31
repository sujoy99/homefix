import { transaction } from 'objection';
import { PlatformSettingKey, JobStatus, PaymentStatus } from '@homefix/shared';
import { IPaymentGateway, PaymentData } from './payment.interface';
import { ManualPaymentGateway } from './gateways/manual.gateway';
import { SslCommerzGateway } from './gateways/sslcommerz.gateway';
import { ConfigService } from '@modules/config/config.service';
import { JobRepository } from '@modules/jobs/job.repository';
import { PaymentRepository } from './payment.repository';
import { CommissionService } from './commission/commission.service';
import { CreatePaymentDTO } from './payment.dto';
import { PaymentRow } from './payment.types';
import { Payment } from './payment.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

type GatewayKey = 'manual' | 'sslcommerz';

const GATEWAY_REGISTRY: Record<GatewayKey, () => IPaymentGateway> = {
  manual: () => new ManualPaymentGateway(),
  sslcommerz: () => new SslCommerzGateway(),
};

/**
 * Reads the active gateway key from platform_settings at request time.
 * No redeploy needed to switch gateways — admin updates the DB row.
 */
async function resolveGateway(): Promise<IPaymentGateway> {
  const key = ((await ConfigService.getSetting(PlatformSettingKey.ACTIVE_PAYMENT_GATEWAY)) ?? 'manual') as GatewayKey;
  const factory = GATEWAY_REGISTRY[key] ?? GATEWAY_REGISTRY['manual'];
  return factory();
}

async function submitPayment(residentId: string, dto: CreatePaymentDTO): Promise<PaymentRow> {
  const job = await JobRepository.findById(dto.job_id);
  if (!job) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Job not found');
  }
  if (job.resident_id !== residentId) {
    throw new ForbiddenError(ErrorCode.JOB_ACCESS_DENIED, 'You do not own this job');
  }
  if (job.status !== JobStatus.AWAITING_PAYMENT) {
    throw new BadRequestError(ErrorCode.INVALID_PAYMENT_STATE, 'Job is not awaiting payment');
  }
  if (job.provider_id === null) {
    throw new BadRequestError(ErrorCode.INVALID_PAYMENT_STATE, 'Job has no assigned provider');
  }

  const existing = await PaymentRepository.findByJobId(dto.job_id);
  if (existing) {
    throw new BadRequestError(ErrorCode.PAYMENT_ALREADY_EXISTS, 'A payment already exists for this job');
  }

  const gatewayData: PaymentData = {
    jobId: dto.job_id,
    residentId,
    providerId: job.provider_id,
    amountPaisa: dto.amount_paisa,
    method: dto.method,
    ...(dto.transaction_id !== undefined ? { transactionId: dto.transaction_id } : {}),
  };
  await (await resolveGateway()).processPayment(gatewayData);

  const createInput = {
    job_id: dto.job_id,
    resident_id: residentId,
    provider_id: job.provider_id,
    amount_paisa: dto.amount_paisa,
    method: dto.method,
    ...(dto.transaction_id !== undefined ? { transaction_id: dto.transaction_id } : {}),
  };
  const payment = await PaymentRepository.create(createInput);

  return payment as unknown as PaymentRow;
}

async function verifyPayment(paymentId: string, adminId: string): Promise<PaymentRow> {
  const payment = await PaymentRepository.findById(paymentId);
  if (!payment) {
    throw new NotFoundError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found');
  }
  if (payment.status !== PaymentStatus.SUBMITTED) {
    throw new BadRequestError(
      ErrorCode.INVALID_PAYMENT_STATE,
      `Cannot verify a payment with status ${payment.status}`
    );
  }

  return transaction(Payment.knex(), async (trx) => {
    const verified = await PaymentRepository.verify(paymentId, adminId, trx);
    if (!verified) {
      throw new NotFoundError(ErrorCode.PAYMENT_NOT_FOUND, 'Payment not found after verify');
    }
    await CommissionService.applyCommission(paymentId, trx);
    return verified as unknown as PaymentRow;
  });
}

async function listPendingPayments(): Promise<Record<string, unknown>[]> {
  return PaymentRepository.listPendingWithDetails();
}

export const paymentService = { resolveGateway, submitPayment, verifyPayment, listPendingPayments };
