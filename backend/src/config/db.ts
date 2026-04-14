import Knex from 'knex';
import { Model } from 'objection';
import knexConfig from '@config/knexfile';
import {env} from '@config/env'



// Initialize Knex
const knex = Knex(knexConfig[env.nodeEnv as keyof typeof knexConfig]);

// Bind Objection.js to Knex
Model.knex(knex);

console.log('DB INIT LOADED');
export default knex;
