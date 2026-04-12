import { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import { HttpResponse } from '@http/response';
import { RegisterDTO, LoginDTO } from '../auth.dto';
import { AuthenticatedRequest } from '@modules/auth/auth.types';

export class AuthControllerV2 {
  /**
   * ============================
   * Register a new user
   * ============================
   */
  static async register(req: Request, res: Response) {
    const data = req.body as RegisterDTO;

    const result = await AuthService.register(data);

    return HttpResponse.success(
      res,
      result,
      'User registered successfully',
      201
    );
  }

}
