const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "tms",
});

const mysqlconnection = () => {
  return connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL database:", error);
    } else {
      console.log("Connected to MySQL database!");
    }
  });
};

module.exports = { connection, mysqlconnection };
