import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Optimized for Neon Serverless Postgres
    pool = new Pool({
      connectionString,
      max: 10, // Reduced - Neon handles pooling on their side
      min: 2,  // Keep 2 connections warm
      idleTimeoutMillis: 60000, // Keep connections alive longer
      connectionTimeoutMillis: 5000, // Faster timeout
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      // Neon-specific optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
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

