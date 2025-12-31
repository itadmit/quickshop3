import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Log connection info (without password)
    const connectionInfo = connectionString.replace(/:[^:@]+@/, ':****@');
    console.log('[DB] Creating new connection pool:', connectionInfo.substring(0, 50) + '...');

    // Optimized for Neon Serverless Postgres
    pool = new Pool({
      connectionString,
      max: 5, // Reduced for serverless - Neon handles pooling
      min: 0, // Don't keep connections warm in serverless (they timeout anyway)
      idleTimeoutMillis: 30000, // Shorter timeout for serverless
      connectionTimeoutMillis: 15000, // Increased timeout for Neon (was 5000)
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      // Neon-specific optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 0, // Start keepalive immediately
      // Allow pool to handle connection errors gracefully
      allowExitOnIdle: true,
    });

    // Handle pool errors - recreate pool on critical errors
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      
      // If it's a critical connection error, reset the pool
      if (err.message?.includes('Connection terminated') || err.code === 'ECONNRESET') {
        console.warn('[DB] Resetting pool due to connection error');
        pool = null; // Force pool recreation on next getDb() call
      }
    });
  }

  return pool;
}

// Helper function to execute queries with retry logic
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDb();
  let lastError: Error | null = null;
  
  // Retry up to 2 times on connection errors
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.query(text, params);
      return result.rows;
    } catch (error: any) {
      lastError = error;
      
      // If it's a connection error and we have retries left, try again
      if (
        (error.code === 'ECONNRESET' || 
         error.message?.includes('Connection terminated') ||
         error.message?.includes('timeout')) &&
        attempt < 2
      ) {
        console.warn(`[DB] Query failed (attempt ${attempt + 1}/3), retrying...`, error.message);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      
      // If it's not a connection error or we're out of retries, throw
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Query failed after retries');
}

// Helper function to execute a single row query
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

