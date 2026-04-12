import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import { required } from '@utils/env-handler';
import {toNumber} from "@utils";
import {Environment} from "@utils/constants";
import path from "path";
// dotenv.config();
const envFile = `.env.${process.env.NODE_ENV ?? 'development'}`;

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});


const knexConfig: Record<Environment, Knex.Config> = {
  development: {
    client: 'pg',
    connection: {
      host: required('DB_HOST'),
      port: toNumber(required('DB_PORT'), 0),
      database: required('DB_NAME'),
      user: required('DB_USER'),
      password: required('DB_PASSWORD'),
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: __dirname + '/../db/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: __dirname + '/../db/seeds',
      extension: 'ts',
    },
  },
  production: {

  },
};

export default knexConfig;
