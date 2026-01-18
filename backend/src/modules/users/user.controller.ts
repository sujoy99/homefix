import { Request, Response } from 'express';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';

/**
 * ============================
 * User Controller
 * ============================
 */
export class UserController {
  /**
   * Get current logged-in user
   *
   * @route   GET /users/me
   * @access  Protected
   */
  static async me(req: AuthenticatedRequest, res: Response) {
    /**
     * req.user is injected by authGuard
     * Never trust client input
     */
    const user = req.user;

    return HttpResponse.success(
      res,
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      'User profile fetched successfully'
    );
  }
}
