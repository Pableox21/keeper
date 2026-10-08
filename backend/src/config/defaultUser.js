const bcrypt = require('bcryptjs');
const { pool } = require('./db');

// Único usuario por defecto del sistema.
// Se puede sobreescribir desde el .env (DEFAULT_USER_*), pero estos son los valores base.
const DEFAULT_USER = {
  username: process.env.DEFAULT_USER_USERNAME || 'kepeer123',
  email: process.env.DEFAULT_USER_EMAIL || 'kepeer123@keeper.com',
  password: process.env.DEFAULT_USER_PASSWORD || '123456',
  nombre_completo: process.env.DEFAULT_USER_NAME || 'Usuario por defecto',
};

// Crea el usuario por defecto SOLO si no existe.
// No pisa la contraseña en cada reinicio: si luego la cambias, se respeta.
async function ensureDefaultUser() {
  let conn;
  try {
    conn = await pool.getConnection();

    const exists = await conn.query(
      'SELECT id FROM usuario WHERE username = ? OR email = ?',
      [DEFAULT_USER.username, DEFAULT_USER.email]
    );
    if (exists.length > 0) {
      console.log(`Usuario por defecto ya existe: ${DEFAULT_USER.username}`);
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_USER.password, 10);
    await conn.query(
      `INSERT INTO usuario (username, email, password_hash, nombre_completo, rol, estado)
       VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVO')`,
      [DEFAULT_USER.username, DEFAULT_USER.email, passwordHash, DEFAULT_USER.nombre_completo]
    );
    console.log(`Usuario por defecto creado: ${DEFAULT_USER.username}`);
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { ensureDefaultUser, DEFAULT_USER };
