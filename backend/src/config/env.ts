import dotenv from 'dotenv';
import path from 'path';
import { SignOptions } from 'jsonwebtoken';
import { toNumber } from '@utils';
// import { toNumber } from '@utils/number.util'; ----- Another Approach. but in tsconfig file need path like @utils/

const envFile = `.env.${process.env.NODE_ENV ?? 'development'}`;

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  /** App */
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),

  /** Default Admin */
  enableSeed: process.env.ENABLE_SEED,
  defaultAdminEmail: required('DEFAULT_ADMIN_EMAIL'),
  defaultAdminPassword: required('DEFAULT_ADMIN_PASSWORD'),

  /** Logging */
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logDir: process.env.LOG_DIR ?? 'logs',
  logRetentionDays: toNumber(process.env.LOG_RETENTION_DAYS, 14),

  /** JWT */
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
    '15m') as SignOptions['expiresIn'],
  jwtRefreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
    '7d') as SignOptions['expiresIn'],
};
