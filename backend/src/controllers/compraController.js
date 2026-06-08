const { pool } = require('../config/db');

// Obtener todas las compras
exports.getAllCompras = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM compra');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una compra por ID
exports.getCompraById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM compra WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear una nueva compra
exports.createCompra = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { proveedor, fecha, total, estado } = req.body;
        const result = await conn.query(
            'INSERT INTO compra (proveedor, fecha, total, estado) VALUES (?, ?, ?, ?)',
            [proveedor, fecha, total, estado]
        );
        res.status(201).json({ id: Number(result.insertId), ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar una compra
exports.updateCompra = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { proveedor, fecha, total, estado } = req.body;
        const result = await conn.query(
            'UPDATE compra SET proveedor = ?, fecha = ?, total = ?, estado = ? WHERE id = ?',
            [proveedor, fecha, total, estado, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ id: req.params.id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar una compra
exports.deleteCompra = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM compra WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ message: 'Compra eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
