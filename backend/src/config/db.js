const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10
});


const poolOptiweb = mariadb.createPool({
  host: process.env.DB_OPTIMUS_HOST,
  user: process.env.DB_OPTIMUS_USER,
  password: process.env.DB_OPTIMUS_PASSWORD,
  database: process.env.DB_OPTIMUS_NAME,
  port: process.env.DB_OPTIMUS_PORT,
  connectionLimit: 5
});

module.exports = {
  pool,
  poolOptiweb
};