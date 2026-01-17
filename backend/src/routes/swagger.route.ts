import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger';
import { env } from '@config/env';

export const swaggerRouter = Router();

/**
 * Swagger UI
 * - Enabled only in non-production
 * - In production, should be protected or disabled
 */
if (env.nodeEnv !== 'production') {
  swaggerRouter.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
}
