import { Response } from 'express';
import { CommissionService } from './commission.service';
import { HttpResponse } from '@http/response';
import { AuthenticatedRequest } from '@modules/auth/auth.types';
import { param } from '@utils';
import type {
  CreateCommissionRuleBody,
  PatchCommissionRuleBody,
  PreviewCommissionQuery,
} from './commission.schema';

export class CommissionController {
  static async listRules(_req: AuthenticatedRequest, res: Response): Promise<Response> {
    const rules = await CommissionService.listRules();
    return HttpResponse.success(res, rules, 'Commission rules retrieved');
  }

  static async createRule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as CreateCommissionRuleBody;
    const rule = await CommissionService.createRule(data, req.user.sub);
    return HttpResponse.success(res, rule, 'Commission rule created', 201);
  }

  static async updateRule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const data = req.body as PatchCommissionRuleBody;
    const rule = await CommissionService.updateRule(param(req, 'id'), data);
    return HttpResponse.success(res, rule, 'Commission rule updated');
  }

  static async deleteRule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    await CommissionService.deleteRule(param(req, 'id'));
    return HttpResponse.success(res, null, 'Commission rule deactivated');
  }

  static async previewRule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const q = req.query as PreviewCommissionQuery;
    const resolved = await CommissionService.previewRule(q);
    return HttpResponse.success(res, resolved, 'Commission preview resolved');
  }
}
