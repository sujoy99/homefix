import { app } from './app';
import { env } from '@config/env'; // 1. loads dotenv internally
import '@config/db';                // 2️. DB loaded
import { logger } from '@logger/logger';
import { seedDefaultAdminInDB } from '@modules/auth/auth.seed';
import { permissionCache } from '@modules/auth/permission.cache';

async function bootstrap() {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION', { error: err });
    process.exit(1);
  });
  
  // Seed data
  // await seedDefaultAdmin();
  if (env.enableSeed !== 'false') {
    await seedDefaultAdminInDB();
  }

  await permissionCache.loadFromDb();

  app.listen(env.port, () => {
    logger.info('HomeFix API started', {
      port: env.port,
      env: env.nodeEnv,
    });
  });
}

bootstrap().catch((err) => {
  logger.error('Server failed to start', err);
  process.exit(1);
});
