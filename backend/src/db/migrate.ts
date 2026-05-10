import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('🔄 Starting migrations...');
        
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            console.log(`\n⏳ Running ${file}...`);
            const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            await pool.query(migrationSQL);
            console.log(`✅ Completed ${file}`);
        }

        console.log('\n🚀 All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
