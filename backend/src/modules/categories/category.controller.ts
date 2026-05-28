import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { HttpResponse } from '@http/response';
import { param } from '@utils';
import { CreateCategoryDTO, UpdateCategoryDTO } from './category.dto';

export class CategoryController {
  static async listActive(_req: Request, res: Response) {
    const categories = await CategoryService.listActive();
    return HttpResponse.success(res, categories, 'Categories fetched');
  }

  static async listAll(_req: Request, res: Response) {
    const categories = await CategoryService.listAll();
    return HttpResponse.success(res, categories, 'All categories fetched');
  }

  static async getById(req: Request, res: Response) {
    const category = await CategoryService.getById(param(req, 'id'));
    return HttpResponse.success(res, category, 'Category fetched');
  }

  static async create(req: Request, res: Response) {
    const data = req.body as CreateCategoryDTO;
    const category = await CategoryService.create(data);
    return HttpResponse.success(res, category, 'Category created', 201);
  }

  static async update(req: Request, res: Response) {
    const data = req.body as UpdateCategoryDTO;
    const category = await CategoryService.update(param(req, 'id'), data);
    return HttpResponse.success(res, category, 'Category updated');
  }

  static async delete(req: Request, res: Response) {
    await CategoryService.delete(param(req, 'id'));
    return HttpResponse.success(res, null, 'Category deleted');
  }
}
