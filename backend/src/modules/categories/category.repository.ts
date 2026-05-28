import { Category } from './category.model';
import { CreateCategoryInput, UpdateCategoryInput } from './category.types';

export class CategoryRepository {
  static async findAll(onlyActive = true): Promise<Category[]> {
    const query = Category.query().orderBy('sort_order', 'asc').orderBy('name', 'asc');
    if (onlyActive) query.where('is_active', true);
    return query;
  }

  static async findById(id: string): Promise<Category | undefined> {
    return Category.query().findById(id);
  }

  static async findBySlug(slug: string): Promise<Category | undefined> {
    return Category.query().findOne({ slug });
  }

  static async create(data: CreateCategoryInput): Promise<Category> {
    return Category.query().insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      icon_url: data.icon_url ?? null,
      requires_area: data.requires_area ?? false,
      sort_order: data.sort_order ?? 0,
    });
  }

  static async update(id: string, data: UpdateCategoryInput): Promise<Category | undefined> {
    return Category.query().patchAndFetchById(id, data);
  }

  static async delete(id: string): Promise<number> {
    return Category.query().deleteById(id);
  }
}
