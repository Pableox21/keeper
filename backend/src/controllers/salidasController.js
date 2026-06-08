// Buscar personal por nombre o apellido (para destino)
exports.buscarPersonal = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        if (!buscar) {
            return res.status(400).json({ error: 'Parámetro "buscar" requerido' });
        }
        const sql = `SELECT codigo as id, CONCAT(nombres, ' ', apellidos) as respuesta FROM personal WHERE CONCAT(nombres, ' ', apellidos) LIKE ? ORDER BY CONCAT(nombres, ' ', apellidos)`;
        const values = [`%${buscar}%`];
        const resultado = await pool.query(sql, values);
        if (resultado && resultado.length > 0) {
            res.json(resultado);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const { pool, poolOptiweb } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');


/--------------------Obtener Opciones para Formulario Salidas-------------------------------------------------------------------------------------/
exports.getOpcionesSalida = async (req, res) => {
    try {
        const [almacenes, tiposSalida, responsables, productos, departamentos, olts] = await Promise.all([
            pool.query(`
                SELECT id, codigo, nombre 
                FROM almacen 
                WHERE estado = "ACTIVO" 
                AND es_principal = 1  -- Solo almacén principal puede hacer salidas iniciales
            `),
            pool.query('SELECT id, nombre FROM tipo_salida'),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"'),
            pool.query(`
                SELECT p.id, p.codigo, p.nombre, p.unidad_ingreso,
                       i.stock_actual, i.id_almacen
                FROM producto p
                INNER JOIN inventario i ON p.id = i.id_producto
                WHERE p.estado = "ACTIVO"
                AND i.id_almacen = 1  -- Solo productos del almacén principal
                AND i.stock_actual > 0
            `),
            pool.query('SELECT id, codigo, nombre FROM departamento'),
            poolOptiweb.query('SELECT codigo as id, nombre as respuesta FROM olt')
        ]);


        // Obtener contratos válidos según la lógica solicitada
        const clientes_internos = await poolOptiweb.query(`
                        SELECT c.CODIGO as contrato, CONCAT(cl.NOMBRES, ' ', cl.APELLIDOS) as nombre_completo
                        FROM contratos c
                        INNER JOIN clientes cl ON c.COD_CLI = cl.CODIGO
                        WHERE
                            (
                                c.codigo LIKE 'ATT-%'
                                AND CAST(SUBSTRING(c.codigo, 5) AS UNSIGNED) > 100000
                            )
                            OR (
                                c.codigo NOT LIKE 'ATT-%'
                                AND c.codigo REGEXP '^[0-9]+$'
                            )
                        ORDER BY nombre_completo
                `);

        const response = {
            almacenes,
            tiposSalida,
            responsables,
            productos,
            departamentos,
            clientes_internos,
            olts
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/--------------------Obtener todos las salidas---------------------------------------------------------------------------------------------/
exports.getAllSalidas = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.*,
                a_origen.nombre as almacen_origen_nombre,
                ts.nombre as tipo_salida_nombre,
                u.username as responsable_nombre,
                uc.username as creado_por
            FROM salida s
            LEFT JOIN almacen a_origen ON s.id_almacen = a_origen.id
            LEFT JOIN tipo_salida ts ON s.id_tipo_salida = ts.id
            LEFT JOIN usuario u ON s.id_responsable = u.id
            LEFT JOIN usuario uc ON s.created_by = uc.id
            ORDER BY s.fecha DESC
        `;
        const salidas = await pool.query(query);
        res.json(handleBigInt(salidas));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/--------------------Obtener Salida por ID------------------------------------------------------------------------------------------------------/
exports.getSalidaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;

        const salida = await conn.query(`
            SELECT 
                s.*,
                a_origen.nombre as almacen_origen_nombre,
                ts.nombre as tipo_salida_nombre,
                u.username as responsable_nombre,
                uc.username as creado_por
            FROM salida s
            LEFT JOIN almacen a_origen ON s.id_almacen = a_origen.id
            LEFT JOIN tipo_salida ts ON s.id_tipo_salida = ts.id
            LEFT JOIN usuario u ON s.id_responsable = u.id
            LEFT JOIN usuario uc ON s.created_by = uc.id
            WHERE s.id = ?
        `, [Number(id)]);

        if (salida.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }

        const detalles = await conn.query(`
            SELECT 
                sd.*,
                p.codigo as producto_codigo,
                p.nombre as producto_nombre,
                p.unidad_ingreso
            FROM salida_detalle sd
            LEFT JOIN producto p ON sd.id_producto = p.id
            WHERE sd.id_salida = ?
        `, [Number(id)]);

        const salidaCompleta = {
            ...salida[0],
            detalles: handleBigInt(detalles)
        };

        res.json(handleBigInt(salidaCompleta));
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Crear Salida----------------------------------------------------------------------------------------------------------/
exports.createSalida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const {
            id_almacen,
            fecha,
            id_tipo_salida,
            id_responsable,
            detalle,
            observaciones,
            departamento,
            destino,
            detalles
        } = req.body;

        const codigo = await generarCodigoSalida(conn);

        console.log('Detalles recibidos en createSalida:', detalles);
        for (const item of detalles) {
            console.log('Procesando item:', item);
            if (!item || typeof item.id_producto === 'undefined' || typeof item.cantidad === 'undefined') {
                console.error('Detalle de producto mal formado:', item);
                throw new Error('Detalle de producto mal formado');
            }
            const { id_producto, cantidad } = item;

                const rows = await conn.query(
                    `SELECT stock_actual 
                     FROM inventario 
                     WHERE id_producto = ? AND id_almacen = ?`,
                    [Number(id_producto), Number(id_almacen)]
                );

            if (!rows || rows.length === 0 || rows[0].stock_actual < cantidad) {
                throw new Error(`Stock insuficiente para el producto ${id_producto}`);
            }
        }

        const insertValues = [
            codigo,
            fecha,
            Number(id_responsable),
            Number(id_almacen),
            Number(id_tipo_salida),
            detalle,
            departamento,
            destino,
            observaciones,
            Number(req.user?.id)
        ];
        console.log('Valores para INSERT en salida:', insertValues);
        const result = await conn.query(
            `INSERT INTO salida 
            (codigo, fecha, id_responsable, id_almacen, id_tipo_salida, detalle, departamento, destino, observaciones, estado, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
            insertValues
        );

        const id_salida = Number(result.insertId);

        for (const item of detalles) {
            const { id_producto, cantidad, precio_unitario, lote, serie, estado_material } = item;

            await conn.query(
                `INSERT INTO salida_detalle 
                (id_salida, id_producto, cantidad, precio_unitario, lote, serie, estado_material) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_salida,
                    Number(id_producto),
                    Number(cantidad),
                    Number(precio_unitario) || 0,
                    lote,
                    serie,
                    estado_material || 'NUEVO'
                ]
            );

            await actualizarInventarioSalida(
                conn,
                Number(id_producto),
                Number(id_almacen),
                -Number(cantidad)
            );
        }

        await conn.query(
            'UPDATE salida SET estado = "ENTREGADA" WHERE id = ?',
            [id_salida]
        );

        await conn.commit();

        res.status(201).json({
            message: 'Salida creada correctamente',
            id: id_salida,
            codigo: codigo
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error al crear salida:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Funciones auxiiares-----------------------------------------------------------------------------------------------------/
async function generarCodigoSalida(conn) {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rows = await conn.query(
        "SELECT codigo FROM salida WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1",
        [`SAL-${fecha}-%`]
    );
    let next = 1;
    if (rows && rows.length > 0) {
        const lastCodigo = rows[0].codigo;
        const match = lastCodigo.match(/SAL-\d{8}-(\d{4})$/);
        if (match) {
            next = parseInt(match[1], 10) + 1;
        }
    }
    return `SAL-${fecha}-${next.toString().padStart(4, '0')}`;
}


async function actualizarInventarioSalida(conn, id_producto, id_almacen, cantidad) {
    const inventario = await conn.query(
        'SELECT id FROM inventario WHERE id_producto = ? AND id_almacen = ?',
        [id_producto, id_almacen]
    );

    if (inventario.length > 0) {
        await conn.query(
            'UPDATE inventario SET stock_actual = stock_actual + ? WHERE id_producto = ? AND id_almacen = ?',
            [cantidad, id_producto, id_almacen]
        );
    } else {
        await conn.query(
            'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, ?, 0)',
            [id_producto, id_almacen, cantidad > 0 ? cantidad : 0]
        );
    }
}