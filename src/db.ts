import mysql from 'mysql2/promise';

// 微信云托管部署后，环境变量会自动注入这些信息
const pool = mysql.createPool({
    host: '172.16.10.160',
    port: 43306,
//   host: 'jdbc:mysql://mysql:33306/jhc_mh_user?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai', // 云托管内网地址
  user: 'root',    // 数据库用户名
  password: 'Jhc@2024',
  database: 'jhc_mh_user',
  // 对应你链接里的那些参数（useUnicode 等），Node.js 驱动默认已处理或有对应配置
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;