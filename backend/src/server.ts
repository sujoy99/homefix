import http from 'http';
import { app } from './app';
import { env } from '@config/env'; // 1. loads dotenv internally
import '@config/db';                // 2️. DB loaded
import { logger } from '@logger/logger';
import { permissionCache } from '@modules/auth/permission.cache';
import { UserRole } from '@modules/users/user.types';
import { initSocket } from '@lib/socket';

async function loadPermissionsWithRetry(maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await permissionCache.loadFromDb();
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delayMs = attempt * 2_000; // 2 s, 4 s, 6 s, 8 s
      logger.warn(`[PermissionCache] DB not ready (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs / 1000}s…`);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function bootstrap() {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION', { error: err });
    process.exit(1);
  });

  await loadPermissionsWithRetry();

  if (permissionCache.get(UserRole.ADMIN).length === 0) {
    logger.warn('Permission cache has 0 admin permissions — DB may not be seeded yet. Run: make seed && make restart');
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
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
