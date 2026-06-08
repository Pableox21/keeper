const { pool } = require('../config/db');

// Obtener todas las líneas
exports.getAllLineas = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM linea ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una línea por ID
exports.getLineaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM linea WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Línea no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear nueva línea
exports.createLinea = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        const existe = await conn.query('SELECT id FROM linea WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'La línea ya existe' });
        }
        const result = await conn.query('INSERT INTO linea (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: Number(result.insertId), nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar línea
exports.updateLinea = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        const existe = await conn.query('SELECT id FROM linea WHERE nombre = ? AND id != ?', [nombre, req.params.id]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra línea con ese nombre' });
        }
        const result = await conn.query('UPDATE linea SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Línea no encontrada' });
        res.json({ id: req.params.id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar línea
exports.deleteLinea = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const enUso = await conn.query('SELECT COUNT(*) as count FROM producto WHERE id_linea = ?', [req.params.id]);
        if (enUso[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la línea porque está siendo usada en productos' });
        }
        const result = await conn.query('DELETE FROM linea WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Línea no encontrada' });
        res.json({ message: 'Línea eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};