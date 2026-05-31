import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('provider_payment_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    table.enum('mfs_type', ['bkash', 'nagad', 'bank']).notNullable();

    // bKash/Nagad mobile number or bank account number
    table.string('account_number').notNullable();

    // Account holder name — shown to Admin before sending money
    table.string('account_name').notNullable();

    // Only one primary account per provider
    table.boolean('is_primary').notNullable().defaultTo(false);

    table.timestamps(true, true);
  });

  // One primary account per provider
  await knex.raw(`
    CREATE UNIQUE INDEX idx_provider_payment_accounts_one_primary
    ON provider_payment_accounts (user_id)
    WHERE is_primary = true
  `);

  await knex.raw('CREATE INDEX idx_provider_payment_accounts_user_id ON provider_payment_accounts (user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('provider_payment_accounts');
}
