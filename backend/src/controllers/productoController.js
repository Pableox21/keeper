const { pool } = require('../config/db');
// Eliminar todos los productos
exports.deleteAllProductos = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM producto');
        res.json({ message: 'Todos los productos eliminados' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener todos los productos
exports.getAllProductos = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`
            SELECT 
                p.id as id_producto,
                p.codigo,
                p.nombre,
                p.unidad_ingreso,
                p.precio_venta,
                p.stock_minimo,
                p.stock_maximo,
                p.estado,
                p.id_empresa,
                p.id_categoria,
                p.id_unidad_medida,
                e.nombre AS empresa,
                c.nombre AS categoria,
                l.nombre AS linea,
                m.nombre AS marca
            FROM producto p
            LEFT JOIN empresa e ON p.id_empresa = e.id
            LEFT JOIN categoria c ON p.id_categoria = c.id
            LEFT JOIN linea l ON p.id_linea = l.id
            LEFT JOIN marca m ON p.id_marca = m.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener un producto por ID
exports.getProductoById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
    const rows = await conn.query('SELECT *, id as id_producto FROM producto WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear un nuevo producto
exports.createProducto = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { codigo, nombre, unidad_ingreso, stock_minimo, stock_maximo, estado, id_empresa, id_categoria, id_unidad_medida, id_linea, id_marca } = req.body;
        const result = await conn.query(
            `INSERT INTO producto (codigo, nombre, unidad_ingreso, stock_minimo, stock_maximo, estado, id_empresa, id_categoria, id_unidad_medida, id_linea, id_marca) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, unidad_ingreso || 'Unidad', stock_minimo || 0, stock_maximo || null, estado || 'ACTIVO', id_empresa || 1, id_categoria || 1, id_unidad_medida || 1, id_linea || null, id_marca || null]
        );
        res.status(201).json({ id: Number(result.insertId), ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar un producto
exports.updateProducto = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { codigo, nombre, unidad_ingreso, stock_minimo, stock_maximo, estado, id_empresa, id_categoria, id_unidad_medida, id_linea, id_marca } = req.body;
        const result = await conn.query(
            `UPDATE producto SET 
       codigo = ?, nombre = ?, unidad_ingreso = ?, stock_minimo = ?, stock_maximo = ?, estado = ?, id_empresa = ?, id_categoria = ?, id_unidad_medida = ?, id_linea = ?, id_marca = ?
       WHERE id = ?`,
            [codigo, nombre, unidad_ingreso, stock_minimo, stock_maximo, estado, id_empresa, id_categoria, id_unidad_medida, id_linea || null, id_marca || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ id: req.params.id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar un producto
exports.deleteProducto = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM producto WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
