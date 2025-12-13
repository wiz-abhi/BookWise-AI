import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Environment variables loaded from:', path.resolve(__dirname, '../.env'));
console.log('🔧 STORAGE_TYPE:', process.env.STORAGE_TYPE);
