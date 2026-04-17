import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('auth_refresh_tokens', (table) => {
        /**
         * Primary Key
         */
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        // FK to user profile
        table
          .uuid('user_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');

        // FK to auth_account
        table
          .uuid('auth_account_id')
          .notNullable()
          .references('id')
          .inTable('auth_accounts')
          .onDelete('CASCADE');
          
        table.string('device_id', 255).nullable();  
        table.string('ip_address', 45).nullable();
        table.string('user_agent', 255).nullable();
 
        table.string('refresh_token_version', 36).notNullable();  
        
        table.boolean('is_revoked').defaultTo(false);

        // Login / security info
        table.timestamp('expires_at').nullable();

        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.index(['user_id']);
        table.index(['auth_account_id']);
        table.index(['device_id']);
        table.index(['is_revoked']);
        table.index(['expires_at']);
      });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('auth_refresh_tokens');
}

