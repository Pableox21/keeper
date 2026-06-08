const { pool } = require('../config/db');

// Obtener todas las empresas
exports.getAllEmpresas = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM empresa ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una empresa por ID
exports.getEmpresaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM empresa WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Empresa no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear nueva empresa
exports.createEmpresa = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si ya existe
        const existe = await conn.query('SELECT id FROM empresa WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'La empresa ya existe' });
        }
        const result = await conn.query('INSERT INTO empresa (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: Number(result.insertId), nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar empresa
exports.updateEmpresa = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre } = req.body;
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        nombre = nombre.trim().toUpperCase();
        // Verificar si existe otra empresa con el mismo nombre
        const existe = await conn.query('SELECT id FROM empresa WHERE nombre = ? AND id != ?', [nombre, req.params.id]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra empresa con ese nombre' });
        }
        const result = await conn.query('UPDATE empresa SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Empresa no encontrada' });
        res.json({ id: req.params.id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar empresa
exports.deleteEmpresa = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Verificar si la empresa está siendo usada en productos
        const enUso = await conn.query('SELECT COUNT(*) as count FROM producto WHERE id_empresa = ?', [req.params.id]);
        if (enUso[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la empresa porque está siendo usada en productos' });
        }
        const result = await conn.query('DELETE FROM empresa WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Empresa no encontrada' });
        res.json({ message: 'Empresa eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
