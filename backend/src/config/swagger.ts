import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HomeFix API',
      version: '1.0.0',
      description: 'HomeFix – One Stop Solution Backend APIs',
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check APIs' },
      { name: 'Auth', description: 'Authentication APIs' },
    ],
  },

  apis: ['src/modules/**/*.ts', 'src/http/**/*.ts'],
});
