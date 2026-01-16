import dotenv from 'dotenv';
import path from 'path';
import { toNumber } from '@utils';
// import { toNumber } from '@utils/number.util'; ----- Another Approach. but in tsconfig file need path like @utils/

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',

  port: toNumber(process.env.PORT, 3000),

  logLevel: process.env.LOG_LEVEL || 'info',

  logDir: process.env.LOG_DIR || 'logs',

  logRetentionDays: toNumber(process.env.LOG_RETENTION_DAYS, 14),
};
