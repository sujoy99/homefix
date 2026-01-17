import express from 'express';
import cors from 'cors';
import { requestId } from '@middlewares/request-id';
import { requestLogger } from '@middlewares/request-logger';
import { errorHandler } from '@errors/error-handler';
import { swaggerRouter } from '@routes/swagger.route';
import { healthRouter } from '@modules/health/health.route';

export const app = express();

/** Request ID — MUST be first */
app.use(requestId);

/** CORS */
app.use(cors());

/** Body parser */
app.use(express.json());

/** Request logger */
app.use(requestLogger);

/** Swagger */
app.use('/docs', swaggerRouter);

/** Routes */
app.use('/health', healthRouter);

/** Always LAST */
app.use(errorHandler);
