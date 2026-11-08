const { Pool } = require('pg');

// A Pool keeps a set of open connections and reuses them,
// like ADO.NET connection pooling.
function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // AWS RDS requires an encrypted (SSL) connection.
  // Local Docker Postgres doesn't support it, so we turn it off with DB_SSL=false.
  const useSsl = process.env.DB_SSL !== 'false';

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });
}

module.exports = { createPool };