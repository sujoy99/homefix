import { PaymentMethod } from '@homefix/shared';

export interface CreatePaymentDTO {
  job_id: string;
  method: PaymentMethod;
  transaction_id?: string;
  amount_paisa: number;
}
