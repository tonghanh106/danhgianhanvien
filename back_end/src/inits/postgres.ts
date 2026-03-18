import { Pool } from 'pg';
import { ENV } from '../configs/env.config';

// Khởi tạo Connection Pool kết nối tới PostgreSQL
export const pgPool = new Pool({
  host: ENV.DB_HOST,
  port: parseInt(ENV.DB_PORT || '5432', 10),
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  max: 20, // Tối đa 20 connect cùng lúc
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('connect', () => {
  // console.log('✅ Connected to PostgreSQL Database');
});

pgPool.on('error', (err) => {
  console.error('❌ Lỗi kết nối PostgreSQL Pool:', err);
});
