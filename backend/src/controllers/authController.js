const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const INACTIVITY_MINUTES = Number(process.env.SESSION_INACTIVITY_MINUTES || 180);


//////////////////////////////////////// LOGIN ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.login = async (req, res) => {
    let conn;
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' });

        conn = await pool.getConnection();
        const rows = await conn.query('SELECT id, username, password_hash, rol, estado FROM usuario WHERE username = ? OR email = ?', [username, username]);
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const user = rows[0];
        if (user.estado !== 'ACTIVO') return res.status(403).json({ error: 'Usuario no activo' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

        const sessionToken = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + INACTIVITY_MINUTES * 60 * 1000);

        await conn.query(
            'INSERT INTO sessions (session_token, user_id, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
            [sessionToken, user.id, req.ip || null, req.get('User-Agent') || null, expiresAt]
        );

        await conn.query('UPDATE usuario SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        res.json({
            token: sessionToken,
            user: { id: Number(user.id), username: user.username, rol: user.rol }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};


//////////////////////////////////////////// LOGOUT //////////////////////////////////////////////////////////////////////////////////////////
exports.logout = async (req, res) => {
    let conn;
    try {
        const auth = req.get('Authorization') || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(400).json({ error: 'Token requerido' });

        conn = await pool.getConnection();
        await conn.query('DELETE FROM sessions WHERE session_token = ?', [token]);
        res.json({ message: 'Sesión cerrada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};


////////////////////////////////////////////Register////////////////////////////////////////////////////////////////////////////////////
exports.register = async (req, res) => {
    let conn;
    try {
        let { username, email, password, nombre_completo, rol } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: 'username, email y password requeridos' });

        username = username.trim();
        email = email.trim().toLowerCase();
        rol = (rol || 'USUARIO').toUpperCase();

        if (!['ADMIN','SUPERVISOR','USUARIO','SOLO_LECTURA'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
        }

        conn = await pool.getConnection();
        const exists = await conn.query('SELECT id FROM usuario WHERE username = ? OR email = ?', [username, email]);
        if (exists.length > 0) return res.status(400).json({ error: 'username o email ya registrado' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await conn.query(
            'INSERT INTO usuario (username, email, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
            [username, email, hash, nombre_completo || null, rol]
        );

        res.status(201).json({ id: Number(result.insertId), username, email, rol });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};
