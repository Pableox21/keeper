const { pool } = require('../config/db');

exports.getAllTipoDoc = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT id, nombre, descripcion FROM tipo_doc ORDER BY id');
        const safe = rows.map(r => ({ id: Number(r.id), nombre: r.nombre, descripcion: r.descripcion }));
        res.json(safe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};
