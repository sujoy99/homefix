import { app } from './app';
import { env } from '@config/env';
import { logger } from '@logger/logger';
import { seedDefaultAdmin } from '@modules/auth/auth.seed';

async function bootstrap() {
  // Seed data
  await seedDefaultAdmin();
  if (env.enableSeed !== 'false') {
    await seedDefaultAdmin();
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
