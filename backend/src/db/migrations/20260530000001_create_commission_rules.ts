import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('commission_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.enum('scope', ['global', 'category', 'promotion']).notNullable();

    // Nullable — only set for scope=category or scope=promotion
    table.uuid('category_id').nullable().references('id').inTable('categories').onDelete('RESTRICT');

    // DECIMAL(5,4): e.g. 0.2000 = 20%, 0.1500 = 15%. Range: 0.0000–1.0000
    table.decimal('rate', 5, 4).notNullable();

    table.string('label').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    // Nullable = effective immediately / no expiry
    table.timestamp('valid_from', { useTz: true }).nullable();
    table.timestamp('valid_until', { useTz: true }).nullable();

    table.uuid('created_by_admin_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    table.timestamps(true, true);
  });

  // Only one active global rule at a time
  await knex.raw(`
    CREATE UNIQUE INDEX idx_commission_rules_one_active_global
    ON commission_rules (scope)
    WHERE scope = 'global' AND is_active = true
  `);

  // One active category rule per category
  await knex.raw(`
    CREATE UNIQUE INDEX idx_commission_rules_one_active_per_category
    ON commission_rules (category_id)
    WHERE scope = 'category' AND is_active = true
  `);

  await knex.raw('CREATE INDEX idx_commission_rules_scope ON commission_rules (scope, is_active)');
  await knex.raw('CREATE INDEX idx_commission_rules_validity ON commission_rules (valid_from, valid_until)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('commission_rules');
}
