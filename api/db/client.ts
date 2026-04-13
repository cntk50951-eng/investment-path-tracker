// 數據庫客戶端（兼容 Vercel 和 Neon）

import pkg from 'pg';
const { Pool } = pkg;

let pool;

export function getPool() {
  if (!pool) {
    // 優先使用 Vercel Postgres，其次使用 Neon
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('缺少數據庫連接字符串');
    }
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // 最大連接數
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  
  return pool;
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// 測試連接
export async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ 數據庫連接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ 數據庫連接失敗:', error);
    return false;
  }
}
