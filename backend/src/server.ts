import { app } from './app';
import { env } from '@config/env'; // 1. loads dotenv internally
import '@config/db';                // 2️. DB loaded
import { logger } from '@logger/logger';
import { seedDefaultAdmin, seedDefaultAdminInDB } from '@modules/auth/auth.seed';

async function bootstrap() {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
  });
  
  // Seed data
  // await seedDefaultAdmin();
  if (env.enableSeed !== 'false') {
    // await seedDefaultAdmin();
    await seedDefaultAdminInDB();
  }

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
