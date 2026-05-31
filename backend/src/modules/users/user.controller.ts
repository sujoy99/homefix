import { Response } from 'express';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { permissionCache } from '@modules/auth/permission.cache';
import { ProfileCompletionService } from './profile-completion.service';

/**
 * ============================
 * User Controller
 * ============================
 */
export class UserController {
  /**
   * Get current logged-in user (with embedded profile_completion summary)
   *
   * @route   GET /users/me
   * @access  Protected
   */
  static async me(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const permissions = permissionCache.get(user.role);
    const completionResult = await ProfileCompletionService.compute(user.sub, user.role);

    return HttpResponse.success(
      res,
      {
        id: user.sub,
        email: user.email,
        role: user.role,
        permissions,
        profile_completion: ProfileCompletionService.summary(completionResult),
      },
      'User profile fetched successfully'
    );
  }

  /**
   * Get full profile completion breakdown (item list for Profile screen)
   *
   * @route   GET /users/me/profile-completion
   * @access  Protected
   */
  static async getProfileCompletion(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const result = await ProfileCompletionService.compute(user.sub, user.role);
    return HttpResponse.success(res, result, 'Profile completion fetched');
  }
}
