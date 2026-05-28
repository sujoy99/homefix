import type { Knex } from 'knex';

/**
 * Default service categories — bilingual (en + bn).
 * requires_area = true triggers sq. footage input in the booking flow (REQ-006).
 * Idempotent: inserts missing slugs, updates name_bn for existing rows.
 * Run via: make seed
 */
const CATEGORIES = [
  {
    name:          'Plumbing',
    name_bn:       'পাইপলাইন মেরামত',
    slug:          'plumbing',
    description:   'Pipe repairs, leaks, drain cleaning, water heater installation',
    requires_area: false,
    sort_order:    1,
  },
  {
    name:          'Electrical',
    name_bn:       'বৈদ্যুতিক মেরামত',
    slug:          'electrical',
    description:   'Wiring, switches, sockets, circuit breakers, fan installation',
    requires_area: false,
    sort_order:    2,
  },
  {
    name:          'Painting',
    name_bn:       'রং করা',
    slug:          'painting',
    description:   'Interior and exterior wall painting (area-based pricing)',
    requires_area: true,
    sort_order:    3,
  },
  {
    name:          'Carpentry',
    name_bn:       'কাঠের কাজ',
    slug:          'carpentry',
    description:   'Furniture repair, door/window fitting, shelving',
    requires_area: false,
    sort_order:    4,
  },
  {
    name:          'AC Service',
    name_bn:       'এসি সার্ভিস',
    slug:          'ac-service',
    description:   'AC installation, cleaning, gas refill, compressor repair',
    requires_area: false,
    sort_order:    5,
  },
  {
    name:          'Home Cleaning',
    name_bn:       'গৃহ পরিষ্কার',
    slug:          'home-cleaning',
    description:   'Deep cleaning, bathroom scrubbing, kitchen degreasing (area-based pricing)',
    requires_area: true,
    sort_order:    6,
  },
  {
    name:          'Masonry',
    name_bn:       'রাজমিস্ত্রির কাজ',
    slug:          'masonry',
    description:   'Tile laying, wall plastering, floor repair (area-based pricing)',
    requires_area: true,
    sort_order:    7,
  },
  {
    name:          'Pest Control',
    name_bn:       'কীটনাশক সেবা',
    slug:          'pest-control',
    description:   'Cockroach, mosquito, termite, and rodent treatment',
    requires_area: false,
    sort_order:    8,
  },
  {
    name:          'Waterproofing',
    name_bn:       'ওয়াটারপ্রুফিং',
    slug:          'waterproofing',
    description:   'Roof and wall waterproofing, damp-proofing (area-based pricing)',
    requires_area: true,
    sort_order:    9,
  },
  {
    name:          'Welding',
    name_bn:       'ওয়েল্ডিং',
    slug:          'welding',
    description:   'Iron gate, grill, and metal structure fabrication and repair',
    requires_area: false,
    sort_order:    10,
  },
];

export async function seed(knex: Knex): Promise<void> {
  const existing = await knex('categories').select('slug') as Array<{ slug: string }>;
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toInsert = CATEGORIES.filter((c) => !existingSlugs.has(c.slug));
  const toUpdate = CATEGORIES.filter((c) => existingSlugs.has(c.slug));

  if (toInsert.length > 0) {
    await knex('categories').insert(toInsert);
    console.log(`[seed] Inserted ${toInsert.length} categories`);
  }

  // Backfill name_bn for rows that were seeded before this column was added
  for (const cat of toUpdate) {
    await knex('categories').where({ slug: cat.slug }).update({ name_bn: cat.name_bn });
  }

  if (toUpdate.length > 0) {
    console.log(`[seed] Updated name_bn for ${toUpdate.length} existing categories`);
  }
}
