import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
// import { swaggerSpec } from '@config/swagger';
import { swaggerV1Spec } from '@config/swagger.v1';
import { swaggerV2Spec } from '@config/swagger.v2';
import { env } from '@config/env';

export const swaggerRouter = Router();

/**
 * Swagger UI
 * - Enabled only in non-production
 * - In production, should be protected or disabled
 */
// if (env.nodeEnv !== 'production') {
//   swaggerRouter.use(
//     '/',
//     swaggerUi.serve,
//     swaggerUi.setup(swaggerSpec, {
//       explorer: true,
//       swaggerOptions: {
//         persistAuthorization: true,
//       },
//     })
//   );
// }
if (env.nodeEnv !== 'production') {
  // V1 Docs
  swaggerRouter.use(
    '/v1',
    swaggerUi.serveFiles(swaggerV1Spec),
    swaggerUi.setup(swaggerV1Spec, {
      explorer: true,
      swaggerOptions: { persistAuthorization: true },
    })
  );

  // V2 Docs
  swaggerRouter.use(
    '/v2',
    swaggerUi.serveFiles(swaggerV2Spec),
    swaggerUi.setup(swaggerV2Spec, {
      explorer: true,
      swaggerOptions: { persistAuthorization: true },
    })
  );
}
