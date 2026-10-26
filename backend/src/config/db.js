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


// Base externa de Optiweb: si el host no está a mano se corta en ~2,5 s en lugar de esperar los
// 10 s por defecto, para que las pantallas que dependen de ella respondan rápido con sus datos locales.
const poolOptiweb = mariadb.createPool({
  host: process.env.DB_OPTIMUS_HOST,
  user: process.env.DB_OPTIMUS_USER,
  password: process.env.DB_OPTIMUS_PASSWORD,
  database: process.env.DB_OPTIMUS_NAME,
  port: process.env.DB_OPTIMUS_PORT,
  connectionLimit: 5,
  connectTimeout: 2500,
  acquireTimeout: 2500
});

module.exports = {
  pool,
  poolOptiweb
};