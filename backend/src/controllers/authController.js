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


//////////////////////////////////////// HELPERS USUARIOS ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const ROLES = ['ADMIN', 'ALMACEN', 'SUPERVISOR', 'USUARIO', 'SOLO_LECTURA'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Valida y normaliza los datos. Devuelve { data } o { error }.
function validateUserData({ username, email, password, nombre_completo, rol }) {
    if (!username || !email || !password) {
        return { error: 'username, email y password requeridos' };
    }
    username = String(username).trim();
    email = String(email).trim().toLowerCase();
    password = String(password);

    if (username.length < 3 || username.length > 50) return { error: 'El username debe tener entre 3 y 50 caracteres' };
    if (!EMAIL_REGEX.test(email)) return { error: 'Email inválido' };
    if (password.length < MIN_PASSWORD_LENGTH) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };

    rol = String(rol || 'USUARIO').toUpperCase();
    if (!ROLES.includes(rol)) return { error: 'Rol inválido' };

    return { data: { username, email, password, nombre_completo: nombre_completo || null, rol } };
}

// Inserta el usuario (verifica duplicados y hashea la contraseña).
async function insertUser(conn, { username, email, password, nombre_completo, rol }) {
    const exists = await conn.query('SELECT id FROM usuario WHERE username = ? OR email = ?', [username, email]);
    if (exists.length > 0) return { error: 'username o email ya registrado' };

    const hash = await bcrypt.hash(password, 10);
    const result = await conn.query(
        'INSERT INTO usuario (username, email, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
        [username, email, hash, nombre_completo, rol]
    );
    return { user: { id: Number(result.insertId), username, email, rol } };
}


//////////////////////////////////////// CREAR USUARIO (solo ADMIN, puede elegir el rol) ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createUser = async (req, res) => {
    let conn;
    try {
        const { error, data } = validateUserData(req.body);
        if (error) return res.status(400).json({ error });

        conn = await pool.getConnection();
        const { error: insertError, user } = await insertUser(conn, data);
        if (insertError) return res.status(400).json({ error: insertError });

        res.status(201).json(user);
    } catch (err) {
        if (err.errno === 1062) return res.status(400).json({ error: 'username o email ya registrado' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// REGISTRAR USUARIO (público, siempre rol USUARIO) ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.register = async (req, res) => {
    let conn;
    try {
        // Se ignora cualquier "rol" enviado: un registro público nunca puede crear admins.
        const { error, data } = validateUserData({ ...req.body, rol: 'USUARIO' });
        if (error) return res.status(400).json({ error });

        conn = await pool.getConnection();
        const { error: insertError, user } = await insertUser(conn, data);
        if (insertError) return res.status(400).json({ error: insertError });

        res.status(201).json(user);
    } catch (err) {
        if (err.errno === 1062) return res.status(400).json({ error: 'username o email ya registrado' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// LISTAR USUARIOS (solo ADMIN) ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.listUsers = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SELECT id, username, email, nombre_completo, rol, estado, ultimo_acceso, created_at
             FROM usuario
             ORDER BY id ASC`
        );
        res.json(rows.map((u) => ({ ...u, id: Number(u.id) })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// EDITAR USUARIO (solo ADMIN) ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// La contraseña es opcional: si viene vacía no se modifica.
function validateUserUpdate({ username, email, password, nombre_completo, rol }) {
    if (!username || !email || !rol) return { error: 'username, email y rol requeridos' };

    username = String(username).trim();
    email = String(email).trim().toLowerCase();
    rol = String(rol).toUpperCase();

    if (username.length < 3 || username.length > 50) return { error: 'El username debe tener entre 3 y 50 caracteres' };
    if (!EMAIL_REGEX.test(email)) return { error: 'Email inválido' };
    if (!ROLES.includes(rol)) return { error: 'Rol inválido' };
    if (password && String(password).length < MIN_PASSWORD_LENGTH) {
        return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
    }

    return { data: { username, email, password: password ? String(password) : null, nombre_completo: nombre_completo || null, rol } };
}

exports.updateUser = async (req, res) => {
    let conn;
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id inválido' });

        const { error, data } = validateUserUpdate(req.body);
        if (error) return res.status(400).json({ error });

        conn = await pool.getConnection();

        const rows = await conn.query('SELECT id, rol FROM usuario WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Evita que el administrador se quite sus propios permisos y deje el sistema sin admin
        if (Number(req.user.id) === id && data.rol !== rows[0].rol) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }

        const duplicated = await conn.query(
            'SELECT id FROM usuario WHERE (username = ? OR email = ?) AND id <> ?',
            [data.username, data.email, id]
        );
        if (duplicated.length > 0) return res.status(400).json({ error: 'username o email ya registrado' });

        const fields = ['username = ?', 'email = ?', 'nombre_completo = ?', 'rol = ?'];
        const params = [data.username, data.email, data.nombre_completo, data.rol];

        if (data.password) {
            fields.push('password_hash = ?');
            params.push(await bcrypt.hash(data.password, 10));
        }
        params.push(id);

        await conn.query(`UPDATE usuario SET ${fields.join(', ')} WHERE id = ?`, params);

        // Si cambió la contraseña se cierran sus sesiones abiertas
        if (data.password) await conn.query('DELETE FROM sessions WHERE user_id = ?', [id]);

        res.json({ id, username: data.username, email: data.email, nombre_completo: data.nombre_completo, rol: data.rol });
    } catch (err) {
        if (err.errno === 1062) return res.status(400).json({ error: 'username o email ya registrado' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// HABILITAR / DESHABILITAR USUARIO (solo ADMIN) ////////////////////////////////////////////////////////////////////////////////////////////////////
exports.setUserStatus = async (req, res) => {
    let conn;
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id inválido' });
        if (!['ACTIVO', 'INACTIVO'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

        if (Number(req.user.id) === id && estado !== 'ACTIVO') {
            return res.status(400).json({ error: 'No puedes deshabilitar tu propio usuario' });
        }

        conn = await pool.getConnection();

        const rows = await conn.query('SELECT id FROM usuario WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        await conn.query('UPDATE usuario SET estado = ? WHERE id = ?', [estado, id]);

        // Al deshabilitar se cierran sus sesiones abiertas
        if (estado === 'INACTIVO') await conn.query('DELETE FROM sessions WHERE user_id = ?', [id]);

        res.json({ id, estado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
