require('dotenv').config();
const { runMigrations } = require('./schema');
runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
