import { Response } from 'express';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';

export class AdminController {
  /**
   * Admin dashboard
   *
   * @access ADMIN only
   */
  static async dashboard(req: AuthenticatedRequest, res: Response) {
    return HttpResponse.success(
      res,
      {
        message: `Welcome admin ${req.user.email}`,
      },
      'Admin dashboard loaded'
    );
  }

  /**
   * Settings
   *
   * @access ADMIN only
   */
  static async settings(req: AuthenticatedRequest, res: Response) {
    return HttpResponse.success(
      res,
      {
        message: `Settings Management`,
      },
      'Settings loaded'
    );
  }
}
