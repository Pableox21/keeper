const { pool }= require('../config/db');
const INACTIVITY_MINUTES = Number(process.env.SESSION_INACTIVITY_MINUTES || 180);

// Roles encerrados en una sección del sistema: fuera de esas rutas responden 403 aunque la ruta
// no declare requireRole. Se comprueba aquí porque authMiddleware corre en toda ruta autenticada.
const ROLE_SCOPES = {
    ATENCION_CLIENTE: ['/api/clientes']
};

// /api/auth queda siempre disponible: login, logout y perfil propio.
function fueraDelAlcance(rol, originalUrl) {
    const permitido = ROLE_SCOPES[rol];
    if (!permitido) return false;
    const path = String(originalUrl || '').split('?')[0];
    if (path === '/api/auth' || path.startsWith('/api/auth/')) return false;
    return !permitido.some((prefix) => path.startsWith(prefix));
}

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

        if (fueraDelAlcance(req.user.rol, req.originalUrl)) {
            return res.status(403).json({ error: 'Permiso denegado' });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};

// Permite el acceso solo a los roles indicados: requireRole('ADMIN') o requireRole('ADMIN', 'ALMACEN')
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'No autorizado' });
        if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'Permiso denegado' });
        next();
    };
};

// Bloquea los roles indicados: denyRoles('ALMACEN')
exports.denyRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'No autorizado' });
        if (roles.includes(req.user.rol)) return res.status(403).json({ error: 'Permiso denegado' });
        next();
    };
};
