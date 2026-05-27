import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { HttpResponse } from '@http/response';
import { UserRegistrationDTO, UserLoginDTO } from './auth.dto';
import { AuthenticatedRequest, ClientInfo } from '@modules/auth/auth.types';

export class AuthController {
  /**
   * ============================
   * Register a new user
   * ============================
   */
  static async register(req: Request, res: Response) {
    const data = req.body as UserRegistrationDTO;

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
    const data = req.body as UserLoginDTO;

    const result = await AuthService.login(data, req.clientInfo);

    return HttpResponse.success(res, result, 'Login successful');
  }

  /**
   * ============================
   * Refresh Token
   * ============================
   */
  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    const tokens = await AuthService.refresh(refreshToken, req.clientInfo);

    return HttpResponse.success(res, tokens, 'Token refreshed');
  }

  /**
   * ============================
   * Logout
   * ============================
   */
  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);

    return HttpResponse.success(res, null, 'Logout successful');
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response) {
    await AuthService.logoutAll(req.user.sub);

    return HttpResponse.success(res, null, 'Logged out from all devices');
  }
}
