const { pool } = require('../config/db');

// Obtener todas las marcas
exports.getAllMarcas = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM marca ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una marca por ID
exports.getMarcaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM marca WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Marca no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear nueva marca
exports.createMarca = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si ya existe
        const existe = await conn.query('SELECT id FROM marca WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'La marca ya existe' });
        }
        const result = await conn.query('INSERT INTO marca (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: Number(result.insertId), nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar marca
exports.updateMarca = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si existe otra marca con el mismo nombre
        const existe = await conn.query('SELECT id FROM marca WHERE nombre = ? AND id != ?', [nombre, req.params.id]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra marca con ese nombre' });
        }
        const result = await conn.query('UPDATE marca SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Marca no encontrada' });
        res.json({ id: req.params.id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar marca
exports.deleteMarca = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Verificar si la marca está siendo usada en productos
        const enUso = await conn.query('SELECT COUNT(*) as count FROM producto WHERE id_marca = ?', [req.params.id]);
        if (enUso[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la marca porque está siendo usada en productos' });
        }
        const result = await conn.query('DELETE FROM marca WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Marca no encontrada' });
        res.json({ message: 'Marca eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};