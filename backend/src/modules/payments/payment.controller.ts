import { Response } from 'express';
import { paymentService } from './payment.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { CreatePaymentDTO } from './payment.dto';
import { param } from '@utils';

export class PaymentController {
  static async submitPayment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as CreatePaymentDTO;
    const payment = await paymentService.submitPayment(req.user.sub, data);
    return HttpResponse.success(res, payment, 'Payment submitted', 201);
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const payment = await paymentService.verifyPayment(param(req, 'id'), req.user.sub);
    return HttpResponse.success(res, payment, 'Payment verified');
  }
}
