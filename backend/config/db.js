const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

// Test connection instantly on startup
pool.getConnection()
    .then(conn => {
        console.log('✅ Connected successfully to the Remote Hostinger Database.');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Remote Database connection failed:');
        console.error(`Reason: ${err.message}`);
    });

module.exports = pool;