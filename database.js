

// database.js
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,'Abithkani@1826' ,
    database: process.env.DB_NAME || 'college_attendance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connection Test
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
        return;
    }
    console.log('✅ Database Connected Successfully!');
    connection.release();
});

module.exports = promisePool;