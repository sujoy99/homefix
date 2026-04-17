import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

export const swaggerV2Spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
          title: 'HomeFix API - V2 (Latest)',
          version: '2.0.0',
          description: `
    Latest APIs (Some endpoints upgraded)
    Legend:
      ✅ Updated in V2
      🔁 Reused from V1
      ⚠️ Deprecated

    ⚠️ Changes:
    - /auth/register → new implementation
    `,
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v2`,
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
       * Schemas
       * ============================
       */
      schemas: {
         /**
         * ============================
         * COMMON RESPONSES
         * ============================
         */
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

        /**
         * ============================
         * AUTH - USER
         * ============================
         */
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            full_name: { type: 'string', example: 'John Doe' },
            mobile: { type: 'string', example: '01712345678' },
            email: {
              type: 'string',
              nullable: true,
              example: 'john@example.com',
            },
            role: { type: 'string', example: 'resident' },
            status: { type: 'string', example: 'active' },
          },
        },

         /**
         * ============================
         * AUTH - TOKENS
         * ============================
         */
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },

        /**
         * ============================
         * LOGIN RESPONSE
         * ============================
         */
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserResponse',
            },
            tokens: {
              $ref: '#/components/schemas/AuthTokens',
            },
          },
        },

        /**
         * ============================
         * LOGIN REQUEST SCHEMAS
         * ============================
         */
        LoginPassword: {
          type: 'object',
          required: ['method', 'password', 'deviceId'],
          properties: {
            method: {
              type: 'string',
              enum: ['password'],
            },
            mobile: {
              type: 'string',
              example: '01712345678',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'Password@123',
            },
            deviceId: {
              type: 'string',
              example: 'android-device-1',
            },
          },
          description:
            'Login using mobile/email and password (at least one required)',
        },

        LoginOTP: {
          type: 'object',
          required: ['method', 'mobile', 'deviceId'],
          properties: {
            method: {
              type: 'string',
              enum: ['otp'],
            },
            mobile: {
              type: 'string',
              example: '01712345678',
            },
            deviceId: {
              type: 'string',
              example: 'android-device-1',
            },
          },
        },

        LoginGoogle: {
          type: 'object',
          required: ['method', 'email', 'deviceId'],
          properties: {
            method: {
              type: 'string',
              enum: ['google'],
            },
            email: {
              type: 'string',
              example: 'john@gmail.com',
            },
            deviceId: {
              type: 'string',
              example: 'web-browser',
            },
          },
        },

        /**
         * ============================
         * REFRESH TOKEN
         * ============================
         */
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
            },
          },
        },

        RefreshResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },

        /**
         * ============================
         * LOGOUT
         * ============================
         */
        LogoutRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
            },
          },
        },

        /**
         * ============================
         * SESSION
         * ============================
         */
        SessionInfo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            device_id: { type: 'string' },
            ip_address: { type: 'string' },
            user_agent: { type: 'string' },
            is_revoked: { type: 'boolean' },
            created_at: {
              type: 'string',
              format: 'date-time',
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

  apis: [
    'src/modules/*/*.ts',        // base (v1 reused)
    'src/modules/**/v2/*.ts',     // override (v2)
    'src/http/**/*.ts',
  ],
});
