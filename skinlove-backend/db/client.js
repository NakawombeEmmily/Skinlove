import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[db] DATABASE_URL is not set — set it in Render environment variables.");
}

// Neon always requires SSL. Local Postgres usually does not.
const needsSsl = /sslmode=require|neon\.tech/i.test(connectionString || "");

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function queryRows(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}
