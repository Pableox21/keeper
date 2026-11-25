const { pool } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');
const { responderErrorBase } = require('../utils/erroresBase');


function responderErrorInventario(res, err, contexto) {
    return responderErrorBase(res, err, contexto, {
        foranea: 'El almacén o el producto del inventario no existen',
        check: 'El costo promedio y el stock no pueden ser negativos',
        generico: 'No se pudo leer el inventario'
    });
}


/--------------------Obtener inventario por almacén--------------------------------------------------------------------------------------/
exports.getInventarioByAlmacen = async (req, res) => {
    try {
        const idAlmacen = Number(req.params.id_almacen);
        if (!Number.isInteger(idAlmacen) || idAlmacen <= 0) {
            return res.status(400).json({ error: 'El id de almacén debe ser un número entero positivo' });
        }
        
        const query = `
            SELECT 
                i.id,
                i.id_producto,
                i.id_almacen,
                i.stock_actual,
                i.costo_promedio,
                p.codigo as producto_codigo,
                p.nombre as producto_nombre,
                COALESCE(um.nombre, p.unidad_ingreso) as unidad_ingreso,
                p.stock_minimo,
                p.stock_maximo,
                a.codigo as almacen_codigo,
                a.nombre as almacen_nombre,
                (i.stock_actual * i.costo_promedio) as valor_total
            FROM inventario i
            INNER JOIN producto p ON i.id_producto = p.id
            INNER JOIN almacen a ON i.id_almacen = a.id
            LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
            WHERE i.id_almacen = ?
            AND p.estado = 'ACTIVO'
            AND a.estado = 'ACTIVO'
            ORDER BY p.nombre ASC
        `;
        
        const inventario = await pool.query(query, [idAlmacen]);
        res.json(handleBigInt(inventario));
        
    } catch (error) {
        responderErrorInventario(res, error, 'getInventarioByAlmacen');
    }
};