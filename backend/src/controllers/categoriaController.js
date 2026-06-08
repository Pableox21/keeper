const { pool } = require('../config/db');

// Obtener todas las categorías
exports.getAllCategorias = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM categoria ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una categoría por ID
exports.getCategoriaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM categoria WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear nueva categoría
exports.createCategoria = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si ya existe
        const existe = await conn.query('SELECT id FROM categoria WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'La categoría ya existe' });
        }
        const result = await conn.query('INSERT INTO categoria (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: Number(result.insertId), nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar categoría
exports.updateCategoria = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si existe otra categoría con el mismo nombre
        const existe = await conn.query('SELECT id FROM categoria WHERE nombre = ? AND id != ?', [nombre, req.params.id]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra categoría con ese nombre' });
        }
        const result = await conn.query('UPDATE categoria SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ id: req.params.id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar categoría
exports.deleteCategoria = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Verificar si la categoría está siendo usada en productos
        const enUso = await conn.query('SELECT COUNT(*) as count FROM producto WHERE id_categoria = ?', [req.params.id]);
        if (enUso[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la categoría porque está siendo usada en productos' });
        }
        const result = await conn.query('DELETE FROM categoria WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
