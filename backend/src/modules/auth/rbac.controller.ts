import { Request, Response } from 'express';
import { RbacService } from './rbac.service';
import { HttpResponse } from '@http/response';

export class RbacController {
  static async listRoles(req: Request, res: Response) {
    const roles = await RbacService.listRolesWithPermissions();
    return HttpResponse.success(res, roles, 'Roles fetched');
  }

  static async listPermissions(req: Request, res: Response) {
    const permissions = await RbacService.listPermissions();
    return HttpResponse.success(res, permissions, 'Permissions fetched');
  }

  static async assignPermission(req: Request, res: Response) {
    const { role } = req.params as { role: string };
    const { permission_code } = req.body as { permission_code: string };
    await RbacService.assignPermission(role, permission_code);
    return HttpResponse.success(res, null, 'Permission assigned');
  }

  static async revokePermission(req: Request, res: Response) {
    const { role, code } = req.params as { role: string; code: string };
    await RbacService.revokePermission(role, code);
    return HttpResponse.success(res, null, 'Permission revoked');
  }

  static async refreshCache(req: Request, res: Response) {
    await RbacService.refreshCache();
    return HttpResponse.success(res, null, 'Permission cache refreshed');
  }
}
