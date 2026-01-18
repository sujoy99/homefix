import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { HttpResponse } from '@http/response';
import { RegisterDTO, LoginDTO } from './auth.dto';

export class AuthController {
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

  /**
   * ============================
   * Login existing user
   * ============================
   */
  static async login(req: Request, res: Response) {
    const data = req.body as LoginDTO;

    const result = await AuthService.login(data);

    return HttpResponse.success(res, result, 'Login successful');
  }
}
