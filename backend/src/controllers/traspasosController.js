const { pool } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');


/--------------------Obtener Opciones para Formulario Traspasos-----------------------------------------------------------------------------------/
exports.getOpcionesTraspaso = async (req, res) => {
    try {
        const [almacenesOrigen, almacenesDestino, responsables, productos] = await Promise.all([
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
                AND es_tecnico = 1  -- Solo almacenes tecnics como destino
            `),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"'),
            pool.query(`
                SELECT p.*,
                       i.stock_actual, i.id_almacen,
                       ub.nombre AS unidad_nombre, ub.abreviatura AS unidad_abreviatura
                FROM producto p
                INNER JOIN inventario i ON p.id = i.id_producto
                LEFT JOIN unidad_medida ub ON p.id_unidad_medida = ub.id
                WHERE p.estado = "ACTIVO"
                AND i.id_almacen = 1  -- Solo productos del almacén principal
                AND i.stock_actual > 0
            `)
        ]);

        res.json({
            almacenesOrigen,
            almacenesDestino,
            responsables,
            productos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
                p.unidad_ingreso
            FROM traspaso_detalle td
            LEFT JOIN producto p ON td.id_producto = p.id
            WHERE td.id_traspaso = ?
        `, [Number(id)]);

        const traspasoCompleto = {
            ...traspaso[0],
            detalles: handleBigInt(detalles)
        };

        res.json(handleBigInt(traspasoCompleto));
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};

/--------------------Crear Traspaso a tech-------------------------------------------------------------------------------------------------------------/
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

        const almacenDestino = await conn.query(
            'SELECT es_tecnico FROM almacen WHERE id = ?',
            [Number(id_almacen_destino)]
        );

        console.log('Resultado consulta almacen destino:', almacenDestino); // Para debug

        if (!almacenDestino || almacenDestino.length === 0) {
            return res.status(400).json({ 
                error: 'El almacén destino no existe' 
            });
        }

        if (!almacenDestino[0].es_tecnico) {
            return res.status(400).json({ 
                error: 'El almacén destino debe ser un almacén técnico' 
            });
        }

        const codigo = await generarCodigoTraspaso(conn);

        for (const item of detalles) {
            const { id_producto, cantidad } = item;
            
            const inventario = await conn.query(
                `SELECT stock_actual, costo_promedio 
                 FROM inventario 
                 WHERE id_producto = ? AND id_almacen = ?`,
                [Number(id_producto), Number(id_almacen_origen)]
            );

            if (inventario.length === 0 || inventario[0].stock_actual < cantidad) {
                throw new Error(`Stock insuficiente para el producto ${id_producto} en el almacén origen`);
            }
        }

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
            const { id_producto, cantidad, observaciones: obsDetalle } = item;

            const inventarioOrigen = await conn.query(
                `SELECT costo_promedio 
                 FROM inventario 
                 WHERE id_producto = ? AND id_almacen = ?`,
                [Number(id_producto), Number(id_almacen_origen)]
            );

            const valor_unitario = inventarioOrigen[0].costo_promedio;
            const valor_total = Number(cantidad) * Number(valor_unitario);

            await conn.query(
                `INSERT INTO traspaso_detalle 
                (id_traspaso, id_producto, cantidad, valor_unitario, valor_total, observaciones) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    id_traspaso,
                    Number(id_producto),
                    Number(cantidad),
                    Number(valor_unitario),
                    Number(valor_total),
                    obsDetalle
                ]
            );

            // Descontar del almacén origen (cantidad base)
            await actualizarInventarioTraspaso(
                conn, 
                Number(id_producto), 
                Number(id_almacen_origen), 
                -Number(cantidad),
                Number(valor_unitario)
            );

            // Sumar al almacén destino (misma cantidad sin conversión)
            await actualizarInventarioTraspaso(
                conn,
                Number(id_producto),
                Number(id_almacen_destino),
                Number(cantidad),
                Number(valor_unitario)
            );
        }

        await conn.query(
            'UPDATE traspaso SET estado = "COMPLETADO" WHERE id = ?',
            [id_traspaso]
        );

        await conn.commit();
        
        res.status(201).json({ 
            message: 'Traspaso creado correctamente', 
            id: id_traspaso,
            codigo: codigo
        });
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error al crear traspaso:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Funciones auxiliares---------------------------------------------------------------------------------------------------/
async function generarCodigoTraspaso(conn) {
    try {
        const result = await conn.query(
            "SELECT COUNT(*) as count FROM traspaso WHERE DATE(created_at) = CURDATE()"
        );
        
        console.log('Resultado de COUNT:', result);
        
        let count = 0;
        if (result && result.length > 0 && result[0].count !== undefined) {
            count = Number(result[0].count);
        }
        
        const newCount = count + 1;
        const fecha = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const codigo = `TRA-${fecha}-${newCount.toString().padStart(4, '0')}`;
        
        console.log('Código generado:', codigo);
        
        return codigo;
    } catch (error) {
        console.error('Error al generar código de traspaso:', error);
        return `TRA-${Date.now()}`;
    }
}


async function actualizarInventarioTraspaso(conn, id_producto, id_almacen, cantidad, costo_promedio) {
    try {
        const inventario = await conn.query(
            'SELECT id, stock_actual, costo_promedio FROM inventario WHERE id_producto = ? AND id_almacen = ?',
            [id_producto, id_almacen]
        );

        console.log('Inventario encontrado:', inventario);

        if (inventario && inventario.length > 0) {
            let nuevo_costo = inventario[0].costo_promedio;
            if (cantidad > 0) {
                const stock_actual = Number(inventario[0].stock_actual);
                const costo_actual = Number(inventario[0].costo_promedio);
                const valor_agregado = cantidad * costo_promedio;
                
                nuevo_costo = ((stock_actual * costo_actual) + valor_agregado) / (stock_actual + cantidad);
            }

            await conn.query(
                'UPDATE inventario SET stock_actual = stock_actual + ?, costo_promedio = ? WHERE id_producto = ? AND id_almacen = ?',
                [cantidad, nuevo_costo, id_producto, id_almacen]
            );
            
            console.log(`Inventario actualizado - Producto: ${id_producto}, Almacén: ${id_almacen}, Cantidad: ${cantidad}`);
        } else {
            if (cantidad > 0) {
                await conn.query(
                    'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, ?, ?)',
                    [id_producto, id_almacen, cantidad, costo_promedio]
                );
                
                console.log(`Nuevo inventario creado - Producto: ${id_producto}, Almacén: ${id_almacen}, Cantidad: ${cantidad}`);
            }
        }
    } catch (error) {
        console.error('Error en actualizarInventarioTraspaso:', error);
        throw error;
    }
}


/--------------------Actualizar Traspaso-----------------------------------------------------------------------------------------------------------/
exports.updateTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            fecha,
            hora,
            id_almacenero,
            glosa,
            observaciones,
            detalles
        } = req.body;

        const traspasoActual = await conn.query(
            'SELECT * FROM traspaso WHERE id = ?',
            [Number(id)]
        );

        if (traspasoActual.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        if (traspasoActual[0].estado !== 'PENDIENTE') {
            return res.status(400).json({ 
                error: 'Solo se pueden editar traspasos en estado PENDIENTE' 
            });
        }

        const detallesActuales = await conn.query(
            'SELECT * FROM traspaso_detalle WHERE id_traspaso = ?',
            [Number(id)]
        );

        for (const detalle of detallesActuales) {
            await actualizarInventarioTraspaso(
                conn,
                Number(detalle.id_producto),
                Number(traspasoActual[0].id_almacen_origen),
                Number(detalle.cantidad),
                Number(detalle.valor_unitario)
            );

            await actualizarInventarioTraspaso(
                conn,
                Number(detalle.id_producto),
                Number(traspasoActual[0].id_almacen_destino),
                -Number(detalle.cantidad),
                Number(detalle.valor_unitario)
            );
        }

        await conn.query(
            'DELETE FROM traspaso_detalle WHERE id_traspaso = ?',
            [Number(id)]
        );

        for (const item of detalles) {
            const { id_producto, cantidad } = item;
            
            const inventario = await conn.query(
                `SELECT stock_actual 
                 FROM inventario 
                 WHERE id_producto = ? AND id_almacen = ?`,
                [Number(id_producto), Number(traspasoActual[0].id_almacen_origen)]
            );

            if (inventario.length === 0 || inventario[0].stock_actual < cantidad) {
                throw new Error(`Stock insuficiente para el producto ${id_producto} en el almacén origen`);
            }
        }

        await conn.query(
            `UPDATE traspaso 
            SET fecha = ?, hora = ?, id_almacenero = ?, glosa = ?, observaciones = ?, updated_by = ? 
            WHERE id = ?`,
            [
                fecha,
                hora,
                Number(id_almacenero),
                glosa,
                observaciones,
                Number(req.user.id),
                Number(id)
            ]
        );

        for (const item of detalles) {
            const { id_producto, cantidad, observaciones: obsDetalle } = item;

            const inventarioOrigen = await conn.query(
                `SELECT costo_promedio 
                 FROM inventario 
                 WHERE id_producto = ? AND id_almacen = ?`,
                [Number(id_producto), Number(traspasoActual[0].id_almacen_origen)]
            );

            const valor_unitario = inventarioOrigen[0].costo_promedio;
            const valor_total = Number(cantidad) * Number(valor_unitario);

            await conn.query(
                `INSERT INTO traspaso_detalle 
                (id_traspaso, id_producto, cantidad, valor_unitario, valor_total, observaciones) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    Number(id),
                    Number(id_producto),
                    Number(cantidad),
                    Number(valor_unitario),
                    Number(valor_total),
                    obsDetalle
                ]
            );

            await actualizarInventarioTraspaso(
                conn,
                Number(id_producto),
                Number(traspasoActual[0].id_almacen_origen),
                -Number(cantidad),
                Number(valor_unitario)
            );

            await actualizarInventarioTraspaso(
                conn,
                Number(id_producto),
                Number(traspasoActual[0].id_almacen_destino),
                Number(cantidad),
                Number(valor_unitario)
            );
        }

        await conn.commit();

        res.json({ 
            message: 'Traspaso actualizado correctamente',
            id: Number(id)
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error al actualizar traspaso:', error);
        res.status(500).json({ error: error.message });
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

        const traspaso = await conn.query(
            'SELECT * FROM traspaso WHERE id = ?',
            [Number(id)]
        );

        if (traspaso.length === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        if (traspaso[0].estado !== 'PENDIENTE') {
            return res.status(400).json({ 
                error: 'Solo se pueden eliminar traspasos en estado PENDIENTE' 
            });
        }

        const detalles = await conn.query(
            'SELECT * FROM traspaso_detalle WHERE id_traspaso = ?',
            [Number(id)]
        );

        for (const detalle of detalles) {
            await actualizarInventarioTraspaso(
                conn,
                Number(detalle.id_producto),
                Number(traspaso[0].id_almacen_origen),
                Number(detalle.cantidad),
                Number(detalle.valor_unitario)
            );

            await actualizarInventarioTraspaso(
                conn,
                Number(detalle.id_producto),
                Number(traspaso[0].id_almacen_destino),
                -Number(detalle.cantidad),
                Number(detalle.valor_unitario)
            );
        }

        await conn.query(
            'DELETE FROM traspaso_detalle WHERE id_traspaso = ?',
            [Number(id)]
        );

        await conn.query(
            'DELETE FROM traspaso WHERE id = ?',
            [Number(id)]
        );

        await conn.commit();

        res.json({ message: 'Traspaso eliminado correctamente' });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error al eliminar traspaso:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Cambiar Estado del Traspaso-------------------------------------------------------------------------------------------------/
exports.cambiarEstadoTraspaso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const { estado } = req.body;

        const estadosPermitidos = ['PENDIENTE', 'PROCESADO', 'COMPLETADO', 'CANCELADO'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ 
                error: `Estado no válido. Estados permitidos: ${estadosPermitidos.join(', ')}` 
            });
        }

        const result = await conn.query(
            'UPDATE traspaso SET estado = ?, updated_by = ? WHERE id = ?',
            [estado, Number(req.user.id), Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        await conn.commit();

        res.json({ 
            message: `Estado del traspaso actualizado a ${estado}`,
            id: Number(id),
            estado: estado
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error al cambiar estado del traspaso:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};

