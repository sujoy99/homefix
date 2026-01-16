import { app } from './app';
import { env } from './config/env';
import { logger } from '@logger/logger';

app.listen(env.port, () => {
  logger.info('HomeFix API started', {
    port: env.port,
    env: env.nodeEnv
  });
});
