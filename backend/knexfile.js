require('ts-node/register');
require('tsconfig-paths/register');

module.exports = require('./src/config/knexfile.ts').default;
