import express from 'express';
import cors from 'cors';
import { securityHeaders } from '@middlewares/helmet';
import { globalRateLimiter } from '@middlewares/rate-limiter';
import { requestId } from '@middlewares/request-id';
import { requestLogger } from '@middlewares/request-logger';
import { errorHandler } from '@errors/error-handler';
import { swaggerRouter } from '@routes/swagger.route';
import { registerRoutes } from '@routes/index';

export const app = express();

/**
 * ------------------------------
 * Global security headers
 * ------------------------------
 * - Protects against common web vulnerabilities
 * - Must be registered FIRST
 */
app.use(securityHeaders);

/**
 * ------------------------------
 * Global security headers
 * ------------------------------
 * - Protects against common web vulnerabilities
 * - Must be registered FIRST
 */
app.use(globalRateLimiter);

/**
 * ------------------------------
 * CORS configuration
 * ------------------------------
 * - Enables cross-origin requests
 * - Can be restricted later per origin
 */
app.use(cors());

/**
 * ------------------------------
 * Body parser
 * ------------------------------
 * - Parses incoming JSON payloads
 * - Required before controllers
 */
app.use(express.json());

/**
 * ------------------------------
 * Request ID
 * ------------------------------
 * - Assigns a unique ID to each request
 * - Used for tracing logs and errors
 * - MUST run before logger
 */
app.use(requestId);

/**
 * ------------------------------
 * Request logger
 * ------------------------------
 * - Logs method, URL, request ID
 * - Helps debug issues in production
 */
app.use(requestLogger);

/**
 * ------------------------------
 * Swagger documentation
 * ------------------------------
 * - Enabled based on environment
 * - Protected in production
 */
app.use('/docs', swaggerRouter);

/**
 * ------------------------------
 * Application routes
 * ------------------------------
 * - Business domain APIs
 */
registerRoutes(app);

/**
 * ------------------------------
 * Global error handler
 * ------------------------------
 * - MUST be registered last
 * - Catches all unhandled errors
 * - Returns standardized error response
 */
app.use(errorHandler);
