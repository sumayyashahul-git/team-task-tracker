const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects.
// Otherwise the timezone shift can move a due date to the previous day.
// 1082 is Postgres's internal type ID for DATE.
types.setTypeParser(1082, (value) => value);

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