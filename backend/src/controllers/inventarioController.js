const { pool } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');


/--------------------Obtener inventario por almacén--------------------------------------------------------------------------------------/
exports.getInventarioByAlmacen = async (req, res) => {
    try {
        const { id_almacen } = req.params;
        
        const query = `
            SELECT 
                i.id,
                i.id_producto,
                i.id_almacen,
                i.stock_actual,
                i.costo_promedio,
                p.codigo as producto_codigo,
                p.nombre as producto_nombre,
                p.unidad_ingreso,
                p.stock_minimo,
                p.stock_maximo,
                a.codigo as almacen_codigo,
                a.nombre as almacen_nombre,
                (i.stock_actual * i.costo_promedio) as valor_total
            FROM inventario i
            INNER JOIN producto p ON i.id_producto = p.id
            INNER JOIN almacen a ON i.id_almacen = a.id
            WHERE i.id_almacen = ?
            AND p.estado = 'ACTIVO'
            AND a.estado = 'ACTIVO'
            ORDER BY p.nombre ASC
        `;
        
        const inventario = await pool.query(query, [Number(id_almacen)]);
        res.json(handleBigInt(inventario));
        
    } catch (error) {
        console.error('Error al obtener inventario por almacén:', error);
        res.status(500).json({ error: error.message });
    }
};