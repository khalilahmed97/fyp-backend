// MYSQL Connection for Testing Purposes

// const mysql = require("mysql2");

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
// });

// module.exports = connection;


const {Client} = require("pg")
const connection = new Client(process.env.DB_CONNECTION_POOL)

module.exports = connection;
