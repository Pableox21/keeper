const { pool, poolExterna } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');
const { responderErrorBase } = require('../utils/erroresBase');
const { productosConStockInsuficiente, mensajeStockFaltante } = require('../utils/movimientos');

const ESTADOS_SALIDA = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];

// El stock solo está descontado mientras la salida está ENTREGADA.
const salidaDescuentaStock = (estado) => estado === 'ENTREGADA';


// El error de la base se traduce; el SQL crudo solo queda en el log del servidor
function responderErrorSalida(res, err, contexto) {
    return responderErrorBase(res, err, contexto, {
        duplicado: 'No se pudo guardar: el código de la salida ya existe o hay un producto repetido en el detalle',
        foranea: 'El almacén, el tipo de salida, el responsable o algún producto del detalle no existen',
        referencia: 'No se puede eliminar la salida porque está asociada a otros registros',
        check: 'El estado de la salida o el estado del material del detalle no son valores permitidos',
        generico: 'No se pudo completar la operación con la salida'
    });
}

const stockFaltante = (accion, faltantes) => mensajeStockFaltante(accion, faltantes);


/--------------------Obtener Opciones para Formulario Salidas-------------------------------------------------------------------------------------/
exports.getOpcionesSalida = async (req, res) => {
    try {
        const [almacenes, tiposSalida, responsables, departamentos] = await Promise.all([
            pool.query(`
                SELECT id, codigo, nombre
                FROM almacen
                WHERE estado = "ACTIVO"
                AND es_principal = 1  -- Solo el almacén principal hace salidas
            `),
            pool.query('SELECT id, nombre FROM tipo_salida'),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"'),
            pool.query('SELECT id, codigo, nombre FROM departamento')
        ]);

        // Los productos con stock se listan en los almacenes que la pantalla puede usar como origen
        const idsAlmacen = almacenes.map(a => Number(a.id));
        let productos = [];
        if (idsAlmacen.length > 0) {
            productos = await pool.query(`
                SELECT p.id, p.codigo, p.nombre, COALESCE(um.nombre, p.unidad_ingreso) AS unidad_ingreso,
                       i.stock_actual, i.id_almacen
                FROM producto p
                INNER JOIN inventario i ON p.id = i.id_producto
                LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
                WHERE p.estado = "ACTIVO"
                AND i.stock_actual > 0
                AND i.id_almacen IN (${idsAlmacen.map(() => '?').join(',')})
                ORDER BY p.codigo
            `, idsAlmacen);
        }

        // Los OLTS y los contratos internos viven en la base externa: si no está a mano, el formulario
        // se arma igualmente con los datos locales y esos dos combos quedan vacíos.
        let olts = [];
        let clientes_internos = [];
        try {
            [olts, clientes_internos] = await Promise.all([
                poolExterna.query('SELECT codigo as id, nombre as respuesta FROM olt'),
                poolExterna.query(`
                    SELECT c.CODIGO as contrato, CONCAT(cl.NOMBRES, ' ', cl.APELLIDOS) as nombre_completo
                    FROM contratos c
                    INNER JOIN clientes cl ON c.CODIGO = cl.CODIGO
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
                `)
            ]);
        } catch (error) {
            console.warn('Base externa no disponible: opciones de salida sin OLTS ni contratos internos:', error.message);
        }

        res.json(handleBigInt({
            almacenes,
            tiposSalida,
            responsables,
            productos,
            departamentos,
            clientes_internos,
            olts
        }));
    } catch (error) {
        responderErrorSalida(res, error, 'getOpcionesSalida');
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
            ORDER BY s.fecha DESC, s.id DESC
        `;
        const salidas = await pool.query(query);
        res.json(handleBigInt(salidas));
    } catch (error) {
        responderErrorSalida(res, error, 'getAllSalidas');
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
                COALESCE(um.nombre, p.unidad_ingreso) as unidad_ingreso
            FROM salida_detalle sd
            LEFT JOIN producto p ON sd.id_producto = p.id
            LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
            WHERE sd.id_salida = ?
            ORDER BY p.codigo
        `, [Number(id)]);

        const salidaCompleta = {
            ...salida[0],
            detalles: handleBigInt(detalles)
        };

        res.json(handleBigInt(salidaCompleta));
    } catch (error) {
        responderErrorSalida(res, error, 'getSalidaById');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Funciones auxiliares-----------------------------------------------------------------------------------------------------/
async function generarCodigoSalida(conn) {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rows = await conn.query(
        'SELECT codigo FROM salida WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1',
        [`SAL-${fecha}-%`]
    );
    let next = 1;
    if (rows && rows.length > 0) {
        const match = String(rows[0].codigo).match(/SAL-\d{8}-(\d{4})$/);
        if (match) next = parseInt(match[1], 10) + 1;
    }
    return `SAL-${fecha}-${next.toString().padStart(4, '0')}`;
}


// Una salida descuenta stock del almacén: si la fila de inventario no existe es que el producto
// nunca estuvo en ese almacén, y crearla en negativo dejaría el inventario descuadrado.
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
    } else if (cantidad > 0) {
        await conn.query(
            'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, ?, 0)',
            [id_producto, id_almacen, cantidad]
        );
    }
}


// Se necesita la fila de inventario para tocar su stock (devolver una salida borra la fila si no existe)
async function asegurarFilaInventario(conn, id_producto, id_almacen) {
    const filas = await conn.query('SELECT id FROM inventario WHERE id_producto = ? AND id_almacen = ?', [id_producto, id_almacen]);
    if (filas.length === 0) {
        await conn.query(
            'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, 0, 0)',
            [id_producto, id_almacen]
        );
    }
}


async function detallesDeSalida(conn, idSalida) {
    return (await conn.query('SELECT * FROM salida_detalle WHERE id_salida = ?', [Number(idSalida)])) || [];
}


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
            id_orden_trabajo,
            detalle,
            observaciones,
            departamento,
            destino,
            detalles
        } = req.body;

        const almacen = await conn.query('SELECT nombre, estado FROM almacen WHERE id = ?', [Number(id_almacen)]);
        if (almacen.length === 0) {
            return res.status(400).json({ error: 'El almacén no existe' });
        }
        if (almacen[0].estado !== 'ACTIVO') {
            return res.status(400).json({ error: `El almacén "${almacen[0].nombre}" está ${almacen[0].estado}` });
        }

        // El stock se verifica antes de escribir: una salida no puede dejar inventario en negativo
        const faltantes = await productosConStockInsuficiente(conn, detalles, id_almacen);
        if (faltantes.length > 0) {
            await conn.rollback();
            return res.status(400).json({ error: stockFaltante('registrar la salida', faltantes) });
        }

        const codigo = await generarCodigoSalida(conn);

        const result = await conn.query(
            `INSERT INTO salida
            (codigo, fecha, id_responsable, id_almacen, id_tipo_salida, id_orden_trabajo, detalle, departamento, destino, observaciones, estado, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ENTREGADA', ?)`,
            [
                codigo,
                fecha,
                Number(id_responsable),
                Number(id_almacen),
                Number(id_tipo_salida),
                id_orden_trabajo ?? null,
                detalle,
                departamento,
                destino,
                observaciones,
                Number(req.user.id)
            ]
        );

        const id_salida = Number(result.insertId);

        for (const item of detalles) {
            await conn.query(
                `INSERT INTO salida_detalle
                (id_salida, id_producto, cantidad, precio_unitario, lote, serie, estado_material)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_salida,
                    Number(item.id_producto),
                    Number(item.cantidad),
                    Number(item.precio_unitario) || 0,
                    item.lote,
                    item.serie,
                    item.estado_material || 'NUEVO'
                ]
            );

            await actualizarInventarioSalida(
                conn,
                Number(item.id_producto),
                Number(id_almacen),
                -Number(item.cantidad)
            );
        }

        await conn.commit();

        res.status(201).json({
            message: 'Salida creada correctamente',
            id: id_salida,
            codigo: codigo
        });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorSalida(res, error, 'createSalida');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Actualizar Salida-------------------------------------------------------------------------------------------------------/
// Devuelve el stock que salió, aplica el detalle nuevo y lo vuelve a descontar del almacén objetivo.
exports.updateSalida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            fecha,
            id_almacen,
            id_tipo_salida,
            id_responsable,
            id_orden_trabajo,
            detalle,
            observaciones,
            departamento,
            destino,
            detalles
        } = req.body;

        const salidas = await conn.query('SELECT * FROM salida WHERE id = ? FOR UPDATE', [Number(id)]);
        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }
        const salida = salidas[0];

        if (salida.estado === 'CANCELADA') {
            return res.status(400).json({ error: 'Una salida cancelada no se puede editar: vuelva a entregarla primero' });
        }

        const almacenActual = Number(salida.id_almacen);
        const almacenObjetivo = id_almacen !== undefined && id_almacen !== null ? Number(id_almacen) : almacenActual;
        if (almacenObjetivo !== almacenActual) {
            const filas = await conn.query('SELECT nombre, estado FROM almacen WHERE id = ?', [almacenObjetivo]);
            if (filas.length === 0) {
                return res.status(400).json({ error: 'El almacén no existe' });
            }
            if (filas[0].estado !== 'ACTIVO') {
                return res.status(400).json({ error: `El almacén "${filas[0].nombre}" está ${filas[0].estado}` });
            }
        }

        const detallesAnteriores = await detallesDeSalida(conn, id);

        // Primero se devuelve lo que salió: así el saldo del almacén incluye esta misma salida
        if (salidaDescuentaStock(salida.estado)) {
            for (const detalleAnterior of detallesAnteriores) {
                await actualizarInventarioSalida(
                    conn,
                    Number(detalleAnterior.id_producto),
                    almacenActual,
                    Number(detalleAnterior.cantidad)
                );
            }
        }

        const faltantes = await productosConStockInsuficiente(conn, detalles, almacenObjetivo);
        if (faltantes.length > 0) {
            await conn.rollback();
            return res.status(400).json({ error: stockFaltante('actualizar la salida', faltantes) });
        }

        await conn.query(
            `UPDATE salida
            SET fecha = ?, id_almacen = ?, id_responsable = ?, id_tipo_salida = ?, id_orden_trabajo = ?, detalle = ?, departamento = ?, destino = ?, observaciones = ?, updated_by = ?
            WHERE id = ?`,
            [
                fecha,
                almacenObjetivo,
                Number(id_responsable),
                Number(id_tipo_salida),
                id_orden_trabajo ?? null,
                detalle,
                departamento,
                destino,
                observaciones,
                Number(req.user.id),
                Number(id)
            ]
        );

        await conn.query('DELETE FROM salida_detalle WHERE id_salida = ?', [Number(id)]);

        for (const item of detalles) {
            await conn.query(
                `INSERT INTO salida_detalle
                (id_salida, id_producto, cantidad, precio_unitario, lote, serie, estado_material)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    Number(id),
                    Number(item.id_producto),
                    Number(item.cantidad),
                    Number(item.precio_unitario) || 0,
                    item.lote,
                    item.serie,
                    item.estado_material || 'NUEVO'
                ]
            );

            if (salidaDescuentaStock(salida.estado)) {
                await actualizarInventarioSalida(
                    conn,
                    Number(item.id_producto),
                    almacenObjetivo,
                    -Number(item.cantidad)
                );
            }
        }

        await conn.commit();

        res.json({ message: 'Salida actualizada correctamente', id: Number(id) });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorSalida(res, error, 'updateSalida');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Cambiar Estado de la Salida------------------------------------------------------------------------------------------------/
// Cancelar una salida es lo que devuelve el stock al almacén; entregarla lo descuenta.
exports.cambiarEstadoSalida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const { estado } = req.body;

        if (!ESTADOS_SALIDA.includes(estado)) {
            return res.status(400).json({ error: `Estado no válido. Estados permitidos: ${ESTADOS_SALIDA.join(', ')}` });
        }

        const salidas = await conn.query('SELECT * FROM salida WHERE id = ? FOR UPDATE', [Number(id)]);
        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }
        const salida = salidas[0];

        if (salida.estado === estado) {
            return res.status(400).json({ error: `La salida ya está ${estado.toLowerCase()}` });
        }

        const detalles = await detallesDeSalida(conn, id);
        if (detalles.length === 0) {
            return res.status(400).json({ error: 'La salida no tiene productos: no se puede cambiar su estado' });
        }

        const descontaba = salidaDescuentaStock(salida.estado);
        const descontara = salidaDescuentaStock(estado);

        if (descontaba && !descontara) {
            for (const detalle of detalles) {
                await asegurarFilaInventario(conn, Number(detalle.id_producto), Number(salida.id_almacen));
                await actualizarInventarioSalida(
                    conn,
                    Number(detalle.id_producto),
                    Number(salida.id_almacen),
                    Number(detalle.cantidad)
                );
            }
        }

        if (!descontaba && descontara) {
            const faltantes = await productosConStockInsuficiente(conn, detalles, salida.id_almacen);
            if (faltantes.length > 0) {
                await conn.rollback();
                return res.status(400).json({ error: stockFaltante('entregar la salida', faltantes) });
            }
            for (const detalle of detalles) {
                await actualizarInventarioSalida(
                    conn,
                    Number(detalle.id_producto),
                    Number(salida.id_almacen),
                    -Number(detalle.cantidad)
                );
            }
        }

        await conn.query('UPDATE salida SET estado = ?, updated_by = ? WHERE id = ?', [estado, Number(req.user.id), Number(id)]);
        await conn.commit();

        res.json({ message: `Estado de la salida actualizado a ${estado}`, id: Number(id), estado });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorSalida(res, error, 'cambiarEstadoSalida');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Eliminar Salida----------------------------------------------------------------------------------------------------------/
// Una salida entregada no se borra: se cancela para que el stock vuelva al almacén.
exports.deleteSalida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;

        const salidas = await conn.query('SELECT * FROM salida WHERE id = ? FOR UPDATE', [Number(id)]);
        if (salidas.length === 0) {
            return res.status(404).json({ error: 'Salida no encontrada' });
        }

        if (salidaDescuentaStock(salidas[0].estado)) {
            return res.status(400).json({ error: 'La salida ya descontó stock: cancele la salida antes de eliminarla' });
        }

        await conn.query('DELETE FROM salida_detalle WHERE id_salida = ?', [Number(id)]);
        await conn.query('DELETE FROM salida WHERE id = ?', [Number(id)]);

        await conn.commit();

        res.json({ message: 'Salida eliminada correctamente' });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorSalida(res, error, 'deleteSalida');
    } finally {
        if (conn) conn.release();
    }
};
