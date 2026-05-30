import { Knex } from 'knex';
import { CommissionRuleScope } from '@homefix/shared';

/**
 * Seeds the default global commission rule (20%).
 * This is the fallback rate used when no category or promotion rule matches.
 *
 * To change the rate: insert a new global rule via the admin API (HF-056B).
 * The old rule will be auto-deactivated. Never edit this seed row directly in prod.
 */
export async function seed(knex: Knex): Promise<void> {
  // Admin user id (seeded in 03_admin.ts)
  const admin = await knex('users').where({ mobile: '00000000000' }).first<{ id: string }>();
  if (!admin) return;

  // Idempotent — skip if a global rule already exists
  const existing = await knex('commission_rules').where({ scope: CommissionRuleScope.GLOBAL }).first();
  if (existing) return;

  await knex('commission_rules').insert({
    scope: CommissionRuleScope.GLOBAL,
    category_id: null,
    rate: '0.2000',
    label: 'Default Rate',
    is_active: true,
    valid_from: null,
    valid_until: null,
    created_by_admin_id: admin.id,
  });
}
