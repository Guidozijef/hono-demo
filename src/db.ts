import mysql from 'mysql2/promise';

// 微信云托管部署后，环境变量会自动注入这些信息
const pool = mysql.createPool({
    host: '0.0.0.0',
    port: 8888,
  user: 'root',    // 数据库用户名
  password: '123456',
  database: 'users',
  // 对应你链接里的那些参数（useUnicode 等），Node.js 驱动默认已处理或有对应配置
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;