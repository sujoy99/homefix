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
      /**
       * ============================
       * Security Schemes
       * ============================
       */
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      /**
       * ============================
       * Global Response Schemas
       * ============================
       */
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          required: ['http_code', 'message', 'body'],
          properties: {
            http_code: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Success',
            },
            body: {
              type: 'object',
              nullable: true,
            },
          },
        },

        ApiPaginatedResponse: {
          type: 'object',
          required: ['http_code', 'message', 'body'],
          properties: {
            http_code: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Success',
            },
            body: {
              type: 'object',
              nullable: true,
              required: ['items', 'pagination'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true
                  },
                  example: []
                },
                pagination: {
                  type: 'object',
                  required: ['page', 'limit', 'total', 'totalPages'],
                  properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 20 },
                    total: { type: 'integer', example: 1000 },
                    totalPages: { type: 'integer', example: 50 },
                  },
                },
              },
            },
          },
        },

        ApiErrorResponse: {
          type: 'object',
          required: ['http_code', 'error_code', 'message', 'body'],
          properties: {
            http_code: {
              type: 'integer',
              example: 500,
            },
            error_code: {
              type: 'string',
              example: 'INTERNAL_SERVER_ERROR',
            },
            message: {
              type: 'string',
              example: 'Internal server error',
            },
            body: {
              type: 'object',
              nullable: true,
              example: null,
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    /**
     * ============================
     * Global Security (Default)
     * ============================
     */
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check APIs' },
      { name: 'Auth', description: 'Authentication & Authorization APIs' },
      { name: 'Users', description: 'User related APIs' },
      { name: 'Admin', description: 'Admin protected APIs' },
    ],
  },

  apis: ['src/modules/**/*.ts', 'src/http/**/*.ts'],
});
