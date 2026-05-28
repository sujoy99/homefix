import { getTestDb } from '../helpers/db';

let _seq = 0;
function seq() { return ++_seq; }

export interface FactoryCategoryOptions {
  name?: string;
  slug?: string;
  requires_area?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface FactoryCategoryResult {
  id: string;
  name: string;
  slug: string;
  requires_area: boolean;
  is_active: boolean;
}

export async function createCategory(opts: FactoryCategoryOptions = {}): Promise<FactoryCategoryResult> {
  const db = getTestDb();
  const n = seq();

  const [row] = await db('categories')
    .insert({
      name: opts.name ?? `Category ${n}`,
      slug: opts.slug ?? `category-${n}`,
      requires_area: opts.requires_area ?? false,
      is_active: opts.is_active ?? true,
      sort_order: opts.sort_order ?? n,
    })
    .returning(['id', 'name', 'slug', 'requires_area', 'is_active']);

  return row as FactoryCategoryResult;
}
