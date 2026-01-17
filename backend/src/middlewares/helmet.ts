import helmet from 'helmet';
import { env } from '@config/env';

export const securityHeaders = helmet({
  ...(env.nodeEnv !== 'production' && {
    contentSecurityPolicy: false,
  }),
});
