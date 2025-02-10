import { Pool } from 'pg';

if (!process.env.DB_URL) {
  throw new Error("Database URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool; 