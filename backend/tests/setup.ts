/**
 * Runs in the Jest worker process before each test suite.
 * Ensures:
 *  1. Objection ORM is bound to knex (via transitive app.ts → @config/db import)
 *  2. Permission cache is populated from the test DB's role_permissions table
 */
import '../src/app'; // side-effect: loads @config/db → Model.knex()
import { permissionCache } from '../src/modules/auth/permission.cache';

beforeAll(async () => {
  await permissionCache.loadFromDb();
});
