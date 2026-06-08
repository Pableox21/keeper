const { pool }= require('../config/db');
const INACTIVITY_MINUTES = Number(process.env.SESSION_INACTIVITY_MINUTES || 180);


exports.authMiddleware = async (req, res, next) => {
    let conn;
    try {
        const auth = req.get('Authorization') || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'No autorizado: token faltante' });

        conn = await pool.getConnection();
        const sess = await conn.query('SELECT s.*, u.username, u.rol, u.estado FROM sessions s JOIN usuario u ON u.id = s.user_id WHERE s.session_token = ?', [token]);
        if (!sess || sess.length === 0) {
            return res.status(401).json({ error: 'Sesión inválida' });
        }
        const session = sess[0];
        if (session.estado !== 'ACTIVO') {
            await conn.query('DELETE FROM sessions WHERE session_token = ?', [token]);
            return res.status(403).json({ error: 'Usuario inactivo' });
        }

        const lastActivity = new Date(session.last_activity);
        const now = new Date();
        const diffMs = now - lastActivity;
        const diffMinutes = diffMs / (60 * 1000);

        if (diffMinutes > INACTIVITY_MINUTES) {
            await conn.query('DELETE FROM sessions WHERE session_token = ?', [token]);
            return res.status(440).json({ error: 'Sesión cerrada por inactividad' });
        }

        await conn.query('UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_token = ?', [token]);
        await conn.query('UPDATE usuario SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [session.user_id]);

        req.user = {
            id: session.user_id,
            username: session.username,
            rol: session.rol,
            sessionToken: token
        };

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};

exports.requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'No autorizado' });
        if (req.user.rol !== role) return res.status(403).json({ error: 'Permiso denegado' });
        next();
    };
};
