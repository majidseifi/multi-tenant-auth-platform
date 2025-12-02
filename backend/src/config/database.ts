import { Pool } from 'pg';
import config from './index';

const pool = new Pool({
    connectionString: config.database.url,
    min: config.database.pool.min,
    max: config.database.pool.max,
    idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
    connectionTimeoutMillis: config.database.pool.connectionTimeoutMillis,
    ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export default pool;