import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import { maskSensitiveData } from '@logger/log-mask';
import { env } from '@config/env';

const logDir = env.logDir;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/** Mask sensitive fields */
const maskFormat = winston.format((info) => {
  return maskSensitiveData(info) as winston.Logform.TransformableInfo;
});

const transports: winston.transport[] = [];

/** Console → dev & test (human readable) */
if (env.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/** File → JSON structured logs */
transports.push(
  new DailyRotateFile({
    dirname: logDir,
    filename: '%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: `${env.logRetentionDays}d`,
    format: winston.format.combine(
      maskFormat(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  })
);

export const logger = winston.createLogger({
  level: env.logLevel,
  transports,
});

/** Exceptions */
logger.exceptions.handle(
  new DailyRotateFile({
    dirname: logDir,
    filename: 'exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: `${env.logRetentionDays}d`,
    format: winston.format.combine(
      maskFormat(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  })
);

/** Rejections */
logger.rejections.handle(
  new DailyRotateFile({
    dirname: logDir,
    filename: 'rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: `${env.logRetentionDays}d`,
    format: winston.format.combine(
      maskFormat(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  })
);
