import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from both root and backend directories
// Try root first (parent of backend), then backend directory
dotenv.config({ path: path.join(process.cwd(), '../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? 'Yes ✅' : 'No ❌');

// PostgreSQL connection pool (Neon DB)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds (increased for Neon DB cold starts)
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Neon DB (PostgreSQL)');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err.message);
    // Don't exit process, just log the error and let the pool handle reconnection
});

// Query helper function with retry logic
export const query = async (text: string, params?: any[], retries = 3) => {
    const start = Date.now();
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error: any) {
            lastError = error;

            // Check if it's a connection timeout or termination error
            const isConnectionError =
                error.message?.includes('timeout') ||
                error.message?.includes('terminated') ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT';

            if (isConnectionError && attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
                console.warn(`⚠️ Database connection error (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            console.error('Database query error:', error);
            throw error;
        }
    }

    throw lastError;
};

// Transaction helper
export const transaction = async (callback: (client: any) => Promise<void>) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await callback(client);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export default pool;
