const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  waitForConnections: true,
  connectionLimit: 100,
  debug: false,
});

pool.query("SELECT * FROM accounts", (err, accounts) => {
  if (err) {
    console.error(err);
    return;
  }

  pool.query("SELECT * FROM usergroup", (err, usergroup) => {
    if (err) {
      console.err(err);
      return;
    } else {
      return;
    }
  });
});

module.exports = pool.promise();
