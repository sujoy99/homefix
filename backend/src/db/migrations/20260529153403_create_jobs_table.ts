import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('resident_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('provider_id').nullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');

    table
      .enum('status', ['pending', 'active', 'awaiting_payment', 'paid', 'cancelled'])
      .notNullable()
      .defaultTo('pending');

    table.text('title').nullable();
    table.text('description').notNullable();
    table.text('voice_note_url').nullable();
    table.jsonb('media_urls').notNullable().defaultTo('[]');

    // Service address — structured free-form (house, flat, road, area)
    table.jsonb('service_address').notNullable();

    // Lat/lon stored separately for display; service_location (generated) used for PostGIS queries
    table.decimal('service_lat', 10, 7).nullable();
    table.decimal('service_lon', 10, 7).nullable();

    table.decimal('estimated_budget', 12, 2).nullable();
    table.decimal('square_footage', 10, 2).nullable();

    table.timestamps(true, true);
  });

  // Generated PostGIS geography column for proximity queries (used in HF-032)
  await knex.raw(`
    ALTER TABLE jobs
      ADD COLUMN service_location geography(Point, 4326)
      GENERATED ALWAYS AS (
        CASE
          WHEN service_lat IS NOT NULL AND service_lon IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint(service_lon, service_lat), 4326)::geography
          ELSE NULL
        END
      ) STORED
  `);

  await knex.raw('CREATE INDEX idx_jobs_service_location ON jobs USING GIST (service_location)');
  await knex.raw('CREATE INDEX idx_jobs_resident_id ON jobs (resident_id)');
  await knex.raw('CREATE INDEX idx_jobs_provider_id ON jobs (provider_id)');
  await knex.raw('CREATE INDEX idx_jobs_category_id ON jobs (category_id)');
  await knex.raw('CREATE INDEX idx_jobs_status ON jobs (status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('jobs');
}
