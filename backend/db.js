const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your environment variables.");
}

const shouldUseSsl =
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1");

const pool =
  global.pgPool ||
  new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false
  });

if (!global.pgPool) {
  global.pgPool = pool;
}

module.exports = pool;
