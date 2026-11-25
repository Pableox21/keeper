const { pool } = require('../config/db');

// `unidad_ingreso` es texto y varias pantallas la muestran como si fuera el nombre de la unidad,
// así que siempre se lee (y se escribe) derivada de `id_unidad_medida`.
const PRODUCTO_SELECT = `
    SELECT
        p.id as id_producto,
        p.codigo,
        p.nombre,
        COALESCE(um.nombre, p.unidad_ingreso) AS unidad_ingreso,
        p.precio_venta,
        p.stock_minimo,
        p.stock_maximo,
        p.estado,
        p.id_empresa,
        p.id_categoria,
        p.id_linea,
        p.id_marca,
        p.id_unidad_medida,
        p.created_at,
        p.updated_at,
        p.created_by,
        p.updated_by,
        e.nombre AS empresa,
        c.nombre AS categoria,
        l.nombre AS linea,
        m.nombre AS marca
    FROM producto p
    LEFT JOIN empresa e ON p.id_empresa = e.id
    LEFT JOIN categoria c ON p.id_categoria = c.id
    LEFT JOIN linea l ON p.id_linea = l.id
    LEFT JOIN marca m ON p.id_marca = m.id
    LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
`;

const obtenerProducto = async (conn, id) => {
    const rows = await conn.query(`${PRODUCTO_SELECT} WHERE p.id = ?`, [id]);
    return rows[0] || null;
};

// El usuario que viene de authMiddleware llega como texto
const usuarioId = (req) => req.user ? Number(req.user.id) : null;

// El error de la base se traduce; el SQL crudo solo queda en el log del servidor
function responderErrorProducto(res, err, contexto) {
    const errno = err && err.errno;
    if (errno === 1062) {
        return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }
    if (errno === 1452) {
        return res.status(400).json({ error: 'La empresa, la categoría o la unidad de medida seleccionadas no existen' });
    }
    if (errno === 1451) {
        return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene movimientos o inventario registrados' });
    }
    console.error(`productoController (${contexto}):`, err);
    return res.status(500).json({ error: 'No se pudo completar la operación con el producto' });
}

// Eliminar todos los productos
exports.deleteAllProductos = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM producto');
        res.json({ message: 'Todos los productos eliminados' });
    } catch (err) {
        responderErrorProducto(res, err, 'deleteAllProductos');
    } finally {
        if (conn) conn.release();
    }
};

// Obtener todos los productos
exports.getAllProductos = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(PRODUCTO_SELECT);
        res.json(rows);
    } catch (err) {
        responderErrorProducto(res, err, 'getAllProductos');
    } finally {
        if (conn) conn.release();
    }
};

// Obtener un producto por ID
exports.getProductoById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const producto = await obtenerProducto(conn, req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (err) {
        responderErrorProducto(res, err, 'getProductoById');
    } finally {
        if (conn) conn.release();
    }
};

// Crear un nuevo producto
exports.createProducto = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { codigo, nombre, stock_minimo, stock_maximo, estado, precio_venta, id_empresa, id_categoria, id_unidad_medida, id_linea, id_marca } = req.body;

        const unidad = await conn.query('SELECT nombre FROM unidad_medida WHERE id = ?', [id_unidad_medida]);
        if (unidad.length === 0) return res.status(400).json({ error: 'La unidad de medida no existe' });

        const user = usuarioId(req);
        const result = await conn.query(
            `INSERT INTO producto (codigo, nombre, unidad_ingreso, precio_venta, stock_minimo, stock_maximo, estado, id_empresa, id_categoria, id_unidad_medida, id_linea, id_marca, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, unidad[0].nombre, precio_venta ?? 0, stock_minimo ?? 0, stock_maximo ?? null, estado ?? 'ACTIVO', id_empresa, id_categoria, id_unidad_medida, id_linea ?? null, id_marca ?? null, user, user]
        );
        res.status(201).json(await obtenerProducto(conn, result.insertId));
    } catch (err) {
        responderErrorProducto(res, err, 'createProducto');
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar un producto: los campos que no llegan conservan el valor guardado
exports.updateProducto = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const actual = await obtenerProducto(conn, req.params.id);
        if (!actual) return res.status(404).json({ error: 'Producto no encontrado' });

        const b = req.body;
        const siguiente = (clave) => (clave in b ? b[clave] : actual[clave]);

        const id_unidad_medida = siguiente('id_unidad_medida');
        const unidad = await conn.query('SELECT nombre FROM unidad_medida WHERE id = ?', [id_unidad_medida]);
        if (unidad.length === 0) return res.status(400).json({ error: 'La unidad de medida no existe' });

        await conn.query(
            `UPDATE producto SET
                codigo = ?, nombre = ?, unidad_ingreso = ?, precio_venta = ?, stock_minimo = ?, stock_maximo = ?, estado = ?,
                id_empresa = ?, id_categoria = ?, id_unidad_medida = ?, id_linea = ?, id_marca = ?, updated_by = ?
             WHERE id = ?`,
            [
                siguiente('codigo'),
                siguiente('nombre'),
                unidad[0].nombre,
                siguiente('precio_venta'),
                siguiente('stock_minimo'),
                siguiente('stock_maximo'),
                siguiente('estado'),
                siguiente('id_empresa'),
                siguiente('id_categoria'),
                id_unidad_medida,
                siguiente('id_linea'),
                siguiente('id_marca'),
                usuarioId(req),
                req.params.id
            ]
        );
        res.json(await obtenerProducto(conn, req.params.id));
    } catch (err) {
        responderErrorProducto(res, err, 'updateProducto');
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
        responderErrorProducto(res, err, 'deleteProducto');
    } finally {
        if (conn) conn.release();
    }
};
