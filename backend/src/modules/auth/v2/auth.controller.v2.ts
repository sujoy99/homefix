import { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import { HttpResponse } from '@http/response';
import { RegisterDTO, UserRegistrationDTO, LoginDTO } from '../auth.dto';
import { AuthenticatedRequest } from '@modules/auth/auth.types';

export class AuthControllerV2 {
  /**
   * ============================
   * Register a new user
   * ============================
   */
  static async register(req: Request, res: Response) {
    const data = req.body as UserRegistrationDTO;

    const result = await AuthService.registerUser(data);

    return HttpResponse.success(
      res,
      result,
      'User registered successfully',
      201
    );
  }

}
