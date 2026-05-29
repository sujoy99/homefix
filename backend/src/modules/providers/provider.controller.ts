import { Request, Response } from 'express';
import { ProviderService } from './provider.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { UpdateProviderProfileDTO, AddSkillDTO } from './provider.dto';
import { param } from '@utils';

export class ProviderController {
  static async getMyProfile(req: Request, res: Response) {
    const { sub, role } = (req as AuthenticatedRequest).user;
    const profile = await ProviderService.getOrCreateProfile(sub, role);
    return HttpResponse.success(res, profile, 'Provider profile fetched');
  }

  static async getProfileByUser(req: Request, res: Response) {
    const profile = await ProviderService.getProfileByUserId(param(req, 'user_id'));
    return HttpResponse.success(res, profile, 'Provider profile fetched');
  }

  static async updateMyProfile(req: Request, res: Response) {
    const { sub, role } = (req as AuthenticatedRequest).user;
    const data = req.body as UpdateProviderProfileDTO;
    const profile = await ProviderService.updateProfile(sub, role, data);
    return HttpResponse.success(res, profile, 'Provider profile updated');
  }

  static async listAvailable(req: Request, res: Response) {
    const { lat, lon, radius, category } = req.query as {
      lat?: string; lon?: string; radius?: string; category?: string;
    };

    if (lat && lon) {
      const providers = await ProviderService.listAvailableNearby(
        parseFloat(lat),
        parseFloat(lon),
        radius ? parseFloat(radius) : 10,
        category
      );
      return HttpResponse.success(res, providers, 'Nearby providers fetched');
    }

    const providers = await ProviderService.listAvailable();
    return HttpResponse.success(res, providers, 'Available providers fetched');
  }

  static async addSkill(req: Request, res: Response) {
    const { sub } = (req as AuthenticatedRequest).user;
    const data = req.body as AddSkillDTO;
    const profile = await ProviderService.addSkill(sub, data);
    return HttpResponse.success(res, profile, 'Skill added', 201);
  }

  static async removeSkill(req: Request, res: Response) {
    const { sub } = (req as AuthenticatedRequest).user;
    await ProviderService.removeSkill(sub, param(req, 'skill_id'));
    return HttpResponse.success(res, null, 'Skill removed');
  }
}
