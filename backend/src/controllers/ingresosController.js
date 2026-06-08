const { pool } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');


/--------------------Obtener-Listar Opciones necesarias para Fomrulario Compras--------------------------------------------------------------------------------------/
exports.getOpcionesIngreso = async (req, res) => {
    try {
        const [proveedores, almacenes, tiposIngreso, responsables, productos] = await Promise.all([
            pool.query('SELECT id, cod, nombre FROM proveedor WHERE autorizado = 1'),
            pool.query('SELECT id, codigo, nombre FROM almacen WHERE estado = "ACTIVO"'),
            pool.query('SELECT id, nombre FROM tipo_ingreso WHERE id = 1'),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"'),
            pool.query('SELECT id, codigo, nombre, unidad_ingreso FROM producto WHERE estado = "ACTIVO"')
        ]);

        res.json({
            proveedores,
            almacenes,
            tiposIngreso,
            responsables,
            productos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/--------------------Obtener-Listar todos los ingresos--------------------------------------------------------------------------------------/
exports.getAllIngresos = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                p.nombre as proveedor_nombre,
                a.nombre as almacen_nombre,
                ti.nombre as tipo_ingreso_nombre,
                u.username as responsable_nombre
            FROM ingreso i
            LEFT JOIN proveedor p ON i.id_proveedor = p.id
            LEFT JOIN almacen a ON i.id_almacen = a.id
            LEFT JOIN tipo_ingreso ti ON i.id_tipo_ingreso = ti.id
            LEFT JOIN usuario u ON i.id_responsable = u.id
            ORDER BY i.fecha DESC, i.hora DESC
        `;
        const ingresos = await pool.query(query);
        res.json(handleBigInt(ingresos));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/------------------------------Crear Ingreso por Compra----------------------------------------------------------------------------------------------------/
exports.createIngreso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const {
            id_proveedor,
            id_almacen,
            fecha,
            hora,
            doc_respaldo,
            numero_doc,
            detalle,
            total,
            id_responsable,
            detalles,
            forma_pago
        } = req.body;

        const codigo = await generarCodigoIngreso(conn);
        //console.log("Devuelve: ", codigo);
        const result = await conn.query(
            `INSERT INTO ingreso 
            (id_proveedor, id_almacen, fecha, hora, id_tipo_ingreso, doc_respaldo, numero_doc, codigo, detalle, total, id_responsable, created_by, forma_pago) 
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_proveedor), 
                Number(id_almacen), 
                fecha, 
                hora, 
                doc_respaldo, 
                numero_doc, 
                codigo, 
                detalle, 
                Number(total), 
                Number(id_responsable), 
                Number(req.user.id),
                forma_pago
            ]
        );

        const id_ingreso = Number(result.insertId);

        for (const item of detalles) {
            const { id_producto, cantidad, precio_unitario } = item;
            const subtotal = Number(cantidad) * Number(precio_unitario);

            await conn.query(
                `INSERT INTO ingreso_detalle (id_ingreso, id_producto, cantidad, precio_unitario, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    id_ingreso, 
                    Number(id_producto), 
                    Number(cantidad), 
                    Number(precio_unitario), 
                    Number(subtotal)
                ]
            );

            await actualizarInventario(conn, Number(id_producto), Number(id_almacen), Number(cantidad), Number(precio_unitario));
        }

        await conn.commit();
        
        res.status(201).json({ 
            message: 'Ingreso por compra creado correctamente', 
            id: id_ingreso,
            codigo: codigo
        });
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.log('Error details:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/------------------------------Obtener Ingreso por ID----------------------------------------------------------------------------------------------------/
exports.getIngresoById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;

        const ingreso = await conn.query(`
            SELECT 
                i.*,
                p.nombre as proveedor_nombre,
                a.nombre as almacen_nombre,
                ti.nombre as tipo_ingreso_nombre,
                u.username as responsable_nombre,
                uc.username as creado_por
            FROM ingreso i
            LEFT JOIN proveedor p ON i.id_proveedor = p.id
            LEFT JOIN almacen a ON i.id_almacen = a.id
            LEFT JOIN tipo_ingreso ti ON i.id_tipo_ingreso = ti.id
            LEFT JOIN usuario u ON i.id_responsable = u.id
            LEFT JOIN usuario uc ON i.created_by = uc.id
            WHERE i.id = ?
        `, [Number(id)]);

        if (ingreso.length === 0) {
            return res.status(404).json({ error: 'Ingreso no encontrado' });
        }

        const detalles = await conn.query(`
            SELECT 
                id.*,
                p.codigo as producto_codigo,
                p.nombre as producto_nombre,
                p.unidad_ingreso,
                e.nombre as empresa_nombre,
                c.nombre as categoria_nombre,
                l.nombre as linea_nombre,
                m.nombre as marca_nombre
            FROM ingreso_detalle id
            LEFT JOIN producto p ON id.id_producto = p.id
            LEFT JOIN empresa e ON p.id_empresa = e.id
            LEFT JOIN categoria c ON p.id_categoria = c.id
            LEFT JOIN linea l ON p.id_linea = l.id
            LEFT JOIN marca m ON p.id_marca = m.id
            WHERE id.id_ingreso = ?
        `, [Number(id)]);

        const ingresoCompleto = {
            ...ingreso[0],
            detalles: handleBigInt(detalles)
        };

        res.json(handleBigInt(ingresoCompleto));
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/------------------------------Actualizar Ingreso por Compra----------------------------------------------------------------------------------------------------/
exports.updateIngreso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            id_proveedor,
            id_almacen,
            fecha,
            hora,
            doc_respaldo,
            numero_doc,
            detalle,
            total,
            id_responsable,
            detalles,
            forma_pago
        } = req.body;

        const ingresoActualResult = await conn.query(
            'SELECT * FROM ingreso WHERE id = ?',
            [Number(id)]
        );

        if (!ingresoActualResult || ingresoActualResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Ingreso no encontrado' });
        }

        const ingresoActual = ingresoActualResult[0];

        const detallesActualesResult = await conn.query(
            'SELECT * FROM ingreso_detalle WHERE id_ingreso = ?',
            [Number(id)]
        );

        const detallesActuales = detallesActualesResult || [];

        for (const detalleActual of detallesActuales) {
            await revertirInventario(
                conn, 
                detalleActual.id_producto, 
                ingresoActual.id_almacen,
                detalleActual.cantidad, 
                detalleActual.precio_unitario
            );
        }

        await conn.query(
            `UPDATE ingreso SET 
                id_proveedor = ?, 
                id_almacen = ?, 
                fecha = ?, 
                hora = ?, 
                doc_respaldo = ?, 
                numero_doc = ?, 
                detalle = ?, 
                total = ?, 
                id_responsable = ?,
                updated_by = ?,
                forma_pago = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                Number(id_proveedor),
                Number(id_almacen),
                fecha,
                hora,
                doc_respaldo,
                numero_doc,
                detalle,
                Number(total),
                Number(id_responsable),
                Number(req.user.id),
                forma_pago,
                Number(id)
            ]
        );

        await conn.query(
            'DELETE FROM ingreso_detalle WHERE id_ingreso = ?',
            [Number(id)]
        );

        for (const item of detalles) {
            const { id_producto, cantidad, precio_unitario } = item;
            const subtotal = Number(cantidad) * Number(precio_unitario);

            await conn.query(
                `INSERT INTO ingreso_detalle (id_ingreso, id_producto, cantidad, precio_unitario, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    Number(id),
                    Number(id_producto),
                    Number(cantidad),
                    Number(precio_unitario),
                    Number(subtotal)
                ]
            );

            await actualizarInventario(
                conn, 
                Number(id_producto), 
                Number(id_almacen), 
                Number(cantidad), 
                Number(precio_unitario)
            );
        }

        await conn.commit();
        
        res.json({ 
            message: 'Ingreso actualizado correctamente', 
            id: Number(id)
        });
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.log('Error en updateIngreso:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};

/------------------------------Eliminar Ingreso----------------------------------------------------------------------------------------------------/
exports.deleteIngreso = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { id } = req.params;

        const ingresoResult = await conn.query(
            'SELECT * FROM ingreso WHERE id = ?',
            [Number(id)]
        );

        if (!ingresoResult || ingresoResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Ingreso no encontrado' });
        }

        const ingreso = ingresoResult[0];

        const detallesResult = await conn.query(
            'SELECT * FROM ingreso_detalle WHERE id_ingreso = ?',
            [Number(id)]
        );

        const detalles = detallesResult || [];

        for (const detalle of detalles) {
            await revertirInventario(
                conn, 
                detalle.id_producto, 
                ingreso.id_almacen,
                detalle.cantidad, 
                detalle.precio_unitario
            );
        }

        await conn.query(
            'DELETE FROM ingreso_detalle WHERE id_ingreso = ?',
            [Number(id)]
        );

        await conn.query(
            'DELETE FROM ingreso WHERE id = ?',
            [Number(id)]
        );

        await conn.commit();
        
        res.json({ 
            message: 'Ingreso eliminado correctamente'
        });
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.log('Error en deleteIngreso:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};

/--------------------Funcion Auxiliar para Revertir Inventario--------------------------------------------------------------------------------------/
async function revertirInventario(conn, id_producto, id_almacen, cantidad, precio_unitario) {
    const inventarioResult = await conn.query(
        'SELECT * FROM inventario WHERE id_producto = ? AND id_almacen = ?',
        [Number(id_producto), Number(id_almacen)]
    );

    if (inventarioResult && inventarioResult.length > 0) {
        const existing = inventarioResult[0];
        const nuevoStock = Number(existing.stock_actual) - Number(cantidad);
        
        if (nuevoStock <= 0) {
            await conn.query(
                'DELETE FROM inventario WHERE id_producto = ? AND id_almacen = ?',
                [Number(id_producto), Number(id_almacen)]
            );
        } else {
            await conn.query(
                'UPDATE inventario SET stock_actual = ? WHERE id_producto = ? AND id_almacen = ?',
                [Number(nuevoStock), Number(id_producto), Number(id_almacen)]
            );
        }
    }
}


/--------------------Auxilr para Actualizar Inventario--------------------------------------------------------------------------------------/
async function actualizarInventario(conn, id_producto, id_almacen, cantidad, precio_unitario) {
    const inventarioResult = await conn.query(
        'SELECT * FROM inventario WHERE id_producto = ? AND id_almacen = ?',
        [Number(id_producto), Number(id_almacen)]
    );

    if (inventarioResult && inventarioResult.length > 0) {
        const existing = inventarioResult[0];
        const nuevoStock = Number(existing.stock_actual) + Number(cantidad);
        const nuevoCosto = ((Number(existing.costo_promedio) * Number(existing.stock_actual)) + (Number(precio_unitario) * Number(cantidad))) / nuevoStock;

        await conn.query(
            'UPDATE inventario SET stock_actual = ?, costo_promedio = ? WHERE id_producto = ? AND id_almacen = ?',
            [Number(nuevoStock), Number(nuevoCosto), Number(id_producto), Number(id_almacen)]
        );
    } else {
        await conn.query(
            'INSERT INTO inventario (id_producto, id_almacen, stock_actual, costo_promedio) VALUES (?, ?, ?, ?)',
            [Number(id_producto), Number(id_almacen), Number(cantidad), Number(precio_unitario)]
        );
    }
}


/--------------------Auxiliar para generar Código de Ingreso--------------------------------------------------------------------------------------/
async function generarCodigoIngreso(conn) {
  try {
    const res = await conn.query(`
      SELECT codigo 
      FROM ingreso 
      WHERE codigo LIKE 'ING-%'
      ORDER BY id DESC 
      LIMIT 1
    `);

    const rows = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : (res && res.length ? res : []));

    if (!rows || rows.length === 0 || !rows[0] || !rows[0].codigo) {
      return 'ING-0001';
    }

    const lastCode = rows[0].codigo;
    if (!lastCode || typeof lastCode !== 'string') {
      throw new Error('Formato inesperado de codigo en DB: ' + JSON.stringify(rows[0]));
    }

    const lastPart = lastCode.substring(lastCode.lastIndexOf('-') + 1);
    const lastNumber = parseInt(lastPart, 10);

    if (!isNaN(lastNumber)) {
      const nextNumber = lastNumber + 1;
      return `ING-${String(nextNumber).padStart(4, '0')}`;
    }

    const m = lastCode.match(/(\d+)\s*$/);
    if (m && m[1]) {
      const nextNumber = parseInt(m[1], 10) + 1;
      return `ING-${String(nextNumber).padStart(4, '0')}`;
    }

    throw new Error('No se pudo extraer número de código: ' + lastCode);

  } catch (error) {
    console.error('Error generando código (primario):', error);

    try {
      const res2 = await conn.query('SELECT COALESCE(MAX(id), 0) as maxId FROM ingreso');

      const rows2 = Array.isArray(res2) && Array.isArray(res2[0]) ? res2[0] : (Array.isArray(res2) ? res2 : (res2 && res2.length ? res2 : []));

      let maxId;
      if (Array.isArray(rows2) && rows2.length > 0 && rows2[0].maxId !== undefined) maxId = rows2[0].maxId;
      else if (rows2 && rows2.maxId !== undefined) maxId = rows2.maxId;
      else if (Array.isArray(res2) && res2.length > 0 && res2[0] && res2[0].maxId !== undefined) maxId = res2[0].maxId;
      else maxId = 0;

      maxId = Number(maxId) || 0;
      const nextNumber = maxId + 1;
      return `ING-${String(nextNumber).padStart(4, '0')}`;
    } catch (fallbackError) {
      console.error('Error en fallback (MAX id):', fallbackError);
      const timestamp = Date.now().toString().slice(-6);
      return `ING-${timestamp}`;
    }
  }
}
