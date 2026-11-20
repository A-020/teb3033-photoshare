const mysql = require('mysql2/promise');

// Malaysia time (UTC+8, no daylight saving)
const TIME_ZONE = '+08:00';

// One shared pool serves all concurrent requests.
// Every route imports this pool. No route opens its own connection.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  // How mysql2 reads and writes date values on the Node side
  timezone: TIME_ZONE,
});

// The timezone option above does not change the MySQL server. RDS runs in UTC
// by default, so each new connection also sets its session time zone. Both sides
// then agree, and dates such as the search filter's ?from= and ?to= follow
// Malaysia days. TIMESTAMP values are stored in UTC internally either way.
// The command is queued before the pool hands the connection to any request.
pool.on('connection', (conn) => {
  conn.query(`SET time_zone = '${TIME_ZONE}'`);
});

module.exports = pool;
