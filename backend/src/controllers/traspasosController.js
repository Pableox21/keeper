const { pool } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');
const { responderErrorBase } = require('../utils/erroresBase');
const { productosConStockInsuficiente, mensajeStockInsuficiente, mensajeStockFaltante } = require('../utils/movimientos');

const ESTADOS_TRASPASO = ['PENDIENTE', 'PROCESADO', 'COMPLETADO', 'CANCELADO'];

// El error de la base se traduce; el SQL crudo solo queda en el log del servidor
function responderErrorTraspaso(res, err, contexto) {
    return responderErrorBase(res, err, contexto, {
        duplicado: 'No se pudo guardar: el código del traspaso ya existe o hay un producto repetido en el detalle',
        foranea: 'El almacén de origen, el de destino, el almacenero o algún producto del detalle no existen',
        referencia: 'No se puede eliminar el traspaso porque está asociado a otros registros',
        check: 'La cantidad debe ser mayor a 0 y el valor no puede ser negativo',
        generico: 'No se pudo completar la operación con el traspaso'
    });
}


/--------------------Regla de stock del traspaso-------------------------------------------------------------------------------------------/
// El stock solo está movido mientras el traspaso está COMPLETADO: al completarlo se descuenta del
// origen y se suma al destino, y al cancelarlo vuelve al origen. En PENDIENTE y PROCESADO las
// cantidades son una intención, todavía no tocan el inventario.
async function verificarStockOrigen(conn, detalles, idAlmacen) {
    const faltantes = await productosConStockInsuficiente(conn, detalles, idAlmacen);
    return faltantes.length ? mensajeStockFaltante('completar el traspaso', faltantes) : null;
}

async function verificarStockParaRevertir(conn, detalles, idAlmacenDestino) {
    const faltantes = await productosConStockInsuficiente(conn, detalles, idAlmacenDestino);
    return faltantes.length
        ? mensajeStockInsuficiente('cancelar el traspaso', faltantes, 'el traspaso')
        : null;
}


/--------------------Obtener Opciones para Formulario Traspasos-----------------------------------------------------------------------------------/
exports.getOpcionesTraspaso = async (req, res) => {
    try {
        const [almacenesOrigen, almacenesDestino, responsables] = await Promise.all([
            pool.query(`
                SELECT id, codigo, nombre
                FROM almacen
                WHERE estado = "ACTIVO"
                AND es_principal = 1
            `),
            pool.query(`
                SELECT id, codigo, nombre
                FROM almacen
                WHERE estado = "ACTIVO"
                AND es_tecnico = 1  -- Solo almacenes técnicos como destino
            `),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"')
        ]);

        // Los productos disponibles son los que tienen stock en el almacén principal (o en cualquiera
        // de ellos si algún día hay más de uno marcado como principal)
        const idsOrigen = almacenesOrigen.map(a => Number(a.id));
        let productos = [];
        if (idsOrigen.length > 0) {
            productos = await pool.query(`
                SELECT p.id, p.codigo, p.nombre,
                       COALESCE(um.nombre, p.unidad_ingreso) AS unidad_nombre,
                       i.stock_actual, i.id_almacen, a.nombre AS almacen_nombre
                FROM producto p
                INNER JOIN inventario i ON p.id = i.id_producto AND i.stock_actual > 0
                INNER JOIN almacen a ON a.id = i.id_almacen
                LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
                WHERE p.estado = "ACTIVO"
                AND i.id_almacen IN (${idsOrigen.map(() => '?').join(',')})
                ORDER BY p.codigo
            `, idsOrigen);
        }

        res.json(handleBigInt({
            almacenesOrigen,
            almacenesDestino,
            responsables,
            productos
        }));
    } catch (error) {
        responderErrorTraspaso(res, error, 'getOpcionesTraspaso');
    }
};


/--------------------Obtener todos los traspasos--------------------------------------------------------------------------------------------------/
exports.getAllTraspasos = async (req, res) => {
    try {
        const query = `
            SELECT
                t.*,
                a_origen.nombre as almacen_origen_nombre,
                a_destino.nombre as almacen_destino_nombre,
                u.username as almacenero_nombre,
                uc.username as creado_por
            FROM traspaso t
            LEFT JOIN almacen a_origen ON t.id_almacen_origen = a_origen.id
            LEFT JOIN almacen a_destino ON t.id_almacen_destino = a_destino.id
            LEFT JOIN usuario u ON t.id_almacenero = u.id
            LEFT JOIN usuario uc ON t.created_by = uc.id
            ORDER BY t.fecha DESC, t.hora DESC
        `;
        const traspasos = await pool.query(query);
        res.json(handleBigInt(traspasos));
    } catch (error) {
        responderErrorTraspaso(res, error, 'getAllTraspasos');
    }
};


/--------------------Obtener Traspaso por Id--------------------------------------------------------------------------------------------------/
exports.getTraspasoById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;

        const traspaso = await conn.query(`
            SELECT
                t.*,
                a_origen.nombre as almacen_origen_nombre,
                a_destino.nombre as almacen_destino_nombre,
                u.username as almacenero_nombre,
                uc.username as creado_por
            FROM traspaso t
            LEFT JOIN almacen a_origen ON t.id_almacen_origen = a_origen.id
            LEFT JOIN almacen a_destino ON t.id_almacen_destino = a_destino.id
            LEFT JOIN usuario u ON t.id_almacenero = u.id
            LEFT JOIN usuario uc ON t.created_by = uc.id
            WHERE t.id = ?
        `, [Number(id)]);

        if (traspaso.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        const detalles = await conn.query(`
            SELECT
                td.*,
                p.codigo as producto_codigo,
                p.nombre as producto_nombre,
                COALESCE(um.nombre, p.unidad_ingreso) as unidad_ingreso
            FROM traspaso_detalle td
            LEFT JOIN producto p ON td.id_producto = p.id
            LEFT JOIN unidad_medida um ON p.id_unidad_medida = um.id
            WHERE td.id_traspaso = ?
            ORDER BY p.codigo
        `, [Number(id)]);

        const traspasoCompleto = {
            ...traspaso[0],
            detalles: handleBigInt(detalles)
        };

        res.json(handleBigInt(traspasoCompleto));
    } catch (error) {
        responderErrorTraspaso(res, error, 'getTraspasoById');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Funciones auxiliares---------------------------------------------------------------------------------------------------/
async function generarCodigoTraspaso(conn) {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rows = await conn.query(
        'SELECT codigo FROM traspaso WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1',
        [`TRA-${fecha}-%`]
    );
    // Se numera sobre el último código del día: contar filas dejaría códigos duplicados al borrar un traspaso
    let next = 1;
    if (rows && rows.length > 0) {
        const match = String(rows[0].codigo).match(/TRA-\d{8}-(\d{4})$/);
        if (match) next = parseInt(match[1], 10) + 1;
    }
    return `TRA-${fecha}-${next.toString().padStart(4, '0')}`;
}


async function actualizarInventarioTraspaso(conn, id_producto, id_almacen, cantidad, costo_promedio) {
    const inventario = await conn.query(
        'SELECT id, stock_actual, costo_promedio FROM inventario WHERE id_producto = ? AND id_almacen = ?',
        [id_producto, id_almacen]
    );

    if (inventario && inventario.length > 0) {
        let nuevo_costo = inventario[0].costo_promedio;
        if (cantidad > 0) {
            const stock_actual = Number(inventario[0].stock_actual);
            const costo_actual = Number(inventario[0].costo_promedio);
            nuevo_costo = ((stock_actual * costo_actual) + (cantidad * costo_promedio)) / (stock_actual + cantidad);
        }

        await conn.query(
            'UPDATE inventario SET stock_actual = stock_actual + ?, costo_promedio = ? WHERE id_producto = ? AND id_almacen = ?',
            [cantidad, nuevo_costo, id_producto, id_almacen]
        );
    } else if (cantidad > 0) {
        await conn.query(
            'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, ?, ?)',
            [id_producto, id_almacen, cantidad, costo_promedio]
        );
    }
}


async function moverStock(conn, detalles, idOrigen, idDestino) {
    for (const detalle of detalles) {
        const cantidad = Number(detalle.cantidad);
        const valorUnitario = Number(detalle.valor_unitario);
        await actualizarInventarioTraspaso(conn, Number(detalle.id_producto), Number(idOrigen), -cantidad, valorUnitario);
        await actualizarInventarioTraspaso(conn, Number(detalle.id_producto), Number(idDestino), cantidad, valorUnitario);
    }
}


async function obtenerAlmacen(conn, id) {
    const filas = await conn.query('SELECT id, nombre, estado, es_tecnico, es_principal FROM almacen WHERE id = ?', [Number(id)]);
    return filas.length ? filas[0] : null;
}


/--------------------Crear Traspaso-------------------------------------------------------------------------------------------------------------/
// Se crea en PENDIENTE sin tocar el inventario: el stock se mueve al completarlo.
exports.createTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const {
            id_almacen_origen,
            id_almacen_destino,
            fecha,
            hora,
            id_almacenero,
            glosa,
            observaciones,
            detalles
        } = req.body;

        const origen = await obtenerAlmacen(conn, id_almacen_origen);
        if (!origen) {
            return res.status(400).json({ error: 'El almacén de origen no existe' });
        }
        if (origen.estado !== 'ACTIVO') {
            return res.status(400).json({ error: `El almacén de origen "${origen.nombre}" está ${origen.estado}` });
        }

        const destino = await obtenerAlmacen(conn, id_almacen_destino);
        if (!destino) {
            return res.status(400).json({ error: 'El almacén destino no existe' });
        }
        if (!destino.es_tecnico) {
            return res.status(400).json({ error: 'El almacén destino debe ser un almacén técnico' });
        }
        if (destino.estado !== 'ACTIVO') {
            return res.status(400).json({ error: `El almacén destino "${destino.nombre}" está ${destino.estado}` });
        }

        const codigo = await generarCodigoTraspaso(conn);

        const result = await conn.query(
            `INSERT INTO traspaso
            (codigo, fecha, hora, id_almacen_origen, id_almacen_destino, id_almacenero, glosa, observaciones, estado, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
            [
                codigo,
                fecha,
                hora,
                Number(id_almacen_origen),
                Number(id_almacen_destino),
                Number(id_almacenero),
                glosa,
                observaciones,
                Number(req.user.id)
            ]
        );

        const id_traspaso = Number(result.insertId);

        for (const item of detalles) {
            // El valor de la línea es el costo promedio del origen al momento del traspaso
            const inventarioOrigen = await conn.query(
                'SELECT costo_promedio FROM inventario WHERE id_producto = ? AND id_almacen = ?',
                [Number(item.id_producto), Number(id_almacen_origen)]
            );
            const valor_unitario = inventarioOrigen.length ? Number(inventarioOrigen[0].costo_promedio) : 0;

            await conn.query(
                `INSERT INTO traspaso_detalle
                (id_traspaso, id_producto, cantidad, valor_unitario, valor_total, observaciones)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    id_traspaso,
                    Number(item.id_producto),
                    Number(item.cantidad),
                    valor_unitario,
                    Number(item.cantidad) * valor_unitario,
                    item.observaciones
                ]
            );
        }

        await conn.commit();

        res.status(201).json({
            message: 'Traspaso creado correctamente',
            id: id_traspaso,
            codigo: codigo,
            estado: 'PENDIENTE'
        });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorTraspaso(res, error, 'createTraspaso');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Actualizar Traspaso-----------------------------------------------------------------------------------------------------------/
// Solo se editan los traspasos que todavía no movieron stock (PENDIENTE / PROCESADO).
exports.updateTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            id_almacen_origen,
            id_almacen_destino,
            fecha,
            hora,
            id_almacenero,
            glosa,
            observaciones,
            detalles
        } = req.body;

        const traspasoActual = await conn.query('SELECT * FROM traspaso WHERE id = ?', [Number(id)]);

        if (traspasoActual.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        const estadoActual = traspasoActual[0].estado;
        if (estadoActual === 'COMPLETADO') {
            return res.status(400).json({ error: 'Un traspaso completado no se puede editar: cancele el traspaso y cree uno nuevo' });
        }
        if (estadoActual === 'CANCELADO') {
            return res.status(400).json({ error: 'Un traspaso cancelado no se puede editar: cree un traspaso nuevo' });
        }

        // Los almacenes del request son opcionales; si no llegan se conservan los guardados
        const origen = id_almacen_origen !== undefined && id_almacen_origen !== null
            ? await obtenerAlmacen(conn, id_almacen_origen)
            : await obtenerAlmacen(conn, traspasoActual[0].id_almacen_origen);
        if (!origen) {
            return res.status(400).json({ error: 'El almacén de origen no existe' });
        }

        const destinoId = id_almacen_destino !== undefined && id_almacen_destino !== null
            ? Number(id_almacen_destino)
            : Number(traspasoActual[0].id_almacen_destino);
        const destino = await obtenerAlmacen(conn, destinoId);
        if (!destino) {
            return res.status(400).json({ error: 'El almacén destino no existe' });
        }
        if (!destino.es_tecnico) {
            return res.status(400).json({ error: 'El almacén destino debe ser un almacén técnico' });
        }
        if (Number(origen.id) === destinoId) {
            return res.status(400).json({ error: 'El almacén de origen y el de destino no pueden ser el mismo' });
        }

        await conn.query(
            `UPDATE traspaso
            SET fecha = ?, hora = ?, id_almacen_origen = ?, id_almacen_destino = ?, id_almacenero = ?, glosa = ?, observaciones = ?, updated_by = ?
            WHERE id = ?`,
            [
                fecha,
                hora,
                Number(origen.id),
                destinoId,
                Number(id_almacenero),
                glosa,
                observaciones,
                Number(req.user.id),
                Number(id)
            ]
        );

        await conn.query('DELETE FROM traspaso_detalle WHERE id_traspaso = ?', [Number(id)]);

        for (const item of detalles) {
            const inventarioOrigen = await conn.query(
                'SELECT costo_promedio FROM inventario WHERE id_producto = ? AND id_almacen = ?',
                [Number(item.id_producto), Number(origen.id)]
            );
            const valor_unitario = inventarioOrigen.length ? Number(inventarioOrigen[0].costo_promedio) : 0;

            await conn.query(
                `INSERT INTO traspaso_detalle
                (id_traspaso, id_producto, cantidad, valor_unitario, valor_total, observaciones)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    Number(id),
                    Number(item.id_producto),
                    Number(item.cantidad),
                    valor_unitario,
                    Number(item.cantidad) * valor_unitario,
                    item.observaciones
                ]
            );
        }

        await conn.commit();

        res.json({ message: 'Traspaso actualizado correctamente', id: Number(id) });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorTraspaso(res, error, 'updateTraspaso');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Eliminar Traspaso----------------------------------------------------------------------------------------------------------/
exports.deleteTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;

        const traspaso = await conn.query('SELECT * FROM traspaso WHERE id = ?', [Number(id)]);

        if (traspaso.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        if (traspaso[0].estado === 'COMPLETADO') {
            return res.status(400).json({ error: 'El traspaso ya movió stock: cancele el traspaso antes de eliminarlo' });
        }

        // PENDIENTE y PROCESADO nunca tocaron el inventario y CANCELADO ya lo devolvió, así que no hay stock que revertir
        await conn.query('DELETE FROM traspaso_detalle WHERE id_traspaso = ?', [Number(id)]);
        await conn.query('DELETE FROM traspaso WHERE id = ?', [Number(id)]);

        await conn.commit();

        res.json({ message: 'Traspaso eliminado correctamente' });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorTraspaso(res, error, 'deleteTraspaso');
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Cambiar Estado del Traspaso-------------------------------------------------------------------------------------------------/
// Aquí es donde el traspaso toca (o devuelve) el inventario, con el stock siempre verificado.
exports.cambiarEstadoTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const { estado } = req.body;

        if (!ESTADOS_TRASPASO.includes(estado)) {
            return res.status(400).json({ error: `Estado no válido. Estados permitidos: ${ESTADOS_TRASPASO.join(', ')}` });
        }

        const traspasos = await conn.query('SELECT * FROM traspaso WHERE id = ? FOR UPDATE', [Number(id)]);
        if (traspasos.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }
        const traspaso = traspasos[0];

        if (traspaso.estado === estado) {
            return res.status(400).json({ error: `El traspaso ya está ${estado.toLowerCase()}` });
        }
        if (traspaso.estado === 'CANCELADO') {
            return res.status(400).json({ error: 'Un traspaso cancelado no se puede reactivar: cree un traspaso nuevo' });
        }

        const detalles = await conn.query('SELECT * FROM traspaso_detalle WHERE id_traspaso = ?', [Number(id)]);
        if (detalles.length === 0) {
            return res.status(400).json({ error: 'El traspaso no tiene productos: agregue al menos uno antes de cambiar su estado' });
        }

        if (estado === 'COMPLETADO') {
            const origen = await obtenerAlmacen(conn, traspaso.id_almacen_origen);
            const destino = await obtenerAlmacen(conn, traspaso.id_almacen_destino);
            if (!origen || origen.estado !== 'ACTIVO') {
                return res.status(400).json({ error: 'El almacén de origen no existe o no está activo' });
            }
            if (!destino || !destino.es_tecnico || destino.estado !== 'ACTIVO') {
                return res.status(400).json({ error: 'El almacén destino debe existir, estar activo y ser técnico' });
            }

            const errorStock = await verificarStockOrigen(conn, detalles, traspaso.id_almacen_origen);
            if (errorStock) {
                await conn.rollback();
                return res.status(400).json({ error: errorStock });
            }
            await moverStock(conn, detalles, traspaso.id_almacen_origen, traspaso.id_almacen_destino);
        }

        if (estado === 'CANCELADO' && traspaso.estado === 'COMPLETADO') {
            // Devolver el traspaso exige que el destino aún tenga esas unidades
            const errorStock = await verificarStockParaRevertir(conn, detalles, traspaso.id_almacen_destino);
            if (errorStock) {
                await conn.rollback();
                return res.status(400).json({ error: errorStock });
            }
            await moverStock(conn, detalles, traspaso.id_almacen_destino, traspaso.id_almacen_origen);
        }

        await conn.query(
            'UPDATE traspaso SET estado = ?, updated_by = ? WHERE id = ?',
            [estado, Number(req.user.id), Number(id)]
        );

        await conn.commit();

        res.json({
            message: `Estado del traspaso actualizado a ${estado}`,
            id: Number(id),
            estado: estado
        });

    } catch (error) {
        if (conn) await conn.rollback();
        responderErrorTraspaso(res, error, 'cambiarEstadoTraspaso');
    } finally {
        if (conn) conn.release();
    }
};
