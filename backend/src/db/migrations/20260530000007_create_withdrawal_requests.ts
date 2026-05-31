import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('withdrawal_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('RESTRICT');
    table.uuid('provider_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('mfs_account_id').notNullable().references('id').inTable('provider_payment_accounts').onDelete('RESTRICT');

    table.integer('amount_requested_paisa').notNullable();

    table.enum('status', ['pending', 'completed', 'rejected']).notNullable().defaultTo('pending');

    table.timestamp('requested_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Admin fills these in when marking as sent
    table.integer('amount_sent_paisa').nullable();
    table.timestamp('sent_at', { useTz: true }).nullable();
    table.string('admin_txid').nullable(); // Admin's own bKash TxID as proof of transfer
    table.uuid('processed_by_admin_id').nullable().references('id').inTable('users').onDelete('RESTRICT');
    table.text('admin_note').nullable();
    table.timestamp('processed_at', { useTz: true }).nullable();
  });

  await knex.raw('CREATE INDEX idx_withdrawal_requests_provider_id ON withdrawal_requests (provider_id)');
  await knex.raw('CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests (status)');
  await knex.raw('CREATE INDEX idx_withdrawal_requests_requested_at ON withdrawal_requests (requested_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('withdrawal_requests');
}
