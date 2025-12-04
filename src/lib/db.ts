import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for Neon cloud connection
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

// Helper function to execute queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDb();
  const result = await db.query(text, params);
  return result.rows;
}

// Helper function to execute a single row query
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

