import { CategoryRepository } from './category.repository';
import { Category, CreateCategoryInput, UpdateCategoryInput } from './category.types';
import { NotFoundError, DuplicateError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

export class CategoryService {
  static async listActive(): Promise<Category[]> {
    return CategoryRepository.findAll(true) as Promise<Category[]>;
  }

  static async listAll(): Promise<Category[]> {
    return CategoryRepository.findAll(false) as Promise<Category[]>;
  }

  static async getById(id: string): Promise<Category> {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Category not found');
    }
    return category as unknown as Category;
  }

  static async create(data: CreateCategoryInput): Promise<Category> {
    const existing = await CategoryRepository.findBySlug(data.slug);
    if (existing) {
      throw new DuplicateError(ErrorCode.ALREADY_EXISTS, 'Category slug already exists');
    }
    return CategoryRepository.create(data) as unknown as Promise<Category>;
  }

  static async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    await CategoryService.getById(id);

    if (data.slug) {
      const existing = await CategoryRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new DuplicateError(ErrorCode.ALREADY_EXISTS, 'Category slug already exists');
      }
    }

    const updated = await CategoryRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Category not found');
    }
    return updated as unknown as Category;
  }

  static async delete(id: string): Promise<void> {
    await CategoryService.getById(id);
    await CategoryRepository.delete(id);
  }
}
