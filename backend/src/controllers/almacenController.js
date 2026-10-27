const { pool, poolExterna } = require('../config/db');
const { handleBigInt } = require('../utils/bigIntHandler');


/--------------------Obtener personal tecnico de la base externa-----------------------------------------------------------------------------------/
exports.getPersonalTecnico = async (req, res) => {
    try {
        const query = `
            SELECT 
                CODIGO as id,
                CONCAT(NOMBRES, ' ', APELLIDOS) as nombre_completo,
                CARGO,
                ESTADO,
                CARNET,
                TELEFONO1,
                CORREO
            FROM personal
            WHERE CARGO IN ('SOPORTE TECNICO', 'INSTALADOR', 'REDES')
            AND ESTADO = 'ACTIVO'
            ORDER BY nombre_completo
        `;

        const personal = await poolExterna.query(query);
        res.json(handleBigInt(personal));

    } catch (error) {
        // La base externa no está a mano: sin ella no hay técnicos que listar, se responde una lista vacía
        console.warn('Base externa no disponible: personal tecnico:', error.message);
        res.json([]);
    }
};


/--------------------Obtener-Listar todos los almacenes--------------------------------------------------------------------------------------/
exports.getAllAlmacenes = async (req, res) => {
    try {
        const queryAlmacenes = `
            SELECT 
                a.*,
                ta.nombre as tipo_almacen_nombre,
                ci.codigo as cuenta_contable_codigo,
                ci.nombre as cuenta_contable_nombre,
                u.username as responsable_nombre,
                cc.nombre as centro_costo_nombre
            FROM almacen a
            LEFT JOIN tipo_almacen ta ON a.id_tipo = ta.id
            LEFT JOIN cuenta_inventario ci ON a.id_cuenta_contable = ci.id
            LEFT JOIN usuario u ON a.id_responsable = u.id
            LEFT JOIN centro_costo cc ON a.id_centro_costo = cc.id
            ORDER BY a.es_principal DESC, a.nombre ASC
        `;
        const almacenes = await pool.query(queryAlmacenes);

        // El nombre del técnico vive en la base externa. Si no está a mano, los
        // almacenes se devuelven igualmente con ese dato en null en lugar de fallar la consulta.
        const personalMap = {};
        try {
            const personal = await poolExterna.query(`
                SELECT 
                    CODIGO as id,
                    CONCAT(NOMBRES, ' ', APELLIDOS) as nombre_completo
                FROM personal
            `);
            personal.forEach((p) => {
                personalMap[p.id] = p.nombre_completo;
            });
        } catch (error) {
            console.warn('Base externa no disponible: almacenes sin nombre de tecnico:', error.message);
        }

        const almacenesConTecnico = almacenes.map((almacen) => ({
            ...almacen,
            tecnico_optiweb_nombre: almacen.id_tecnico_optiweb
                ? personalMap[almacen.id_tecnico_optiweb] ?? null
                : null
        }));

        res.json(handleBigInt(almacenesConTecnico));
        
    } catch (error) {
        console.error('Error en getAllAlmacenes:', error);
        res.status(500).json({ error: error.message });
    }
};


/--------------------Obtener-Listar almacen por ID--------------------------------------------------------------------------------------/
exports.getAlmacenById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                a.*,
                ta.nombre as tipo_almacen_nombre,
                ci.codigo as cuenta_contable_codigo,
                ci.nombre as cuenta_contable_nombre,
                u.username as responsable_nombre,
                cc.nombre as centro_costo_nombre
            FROM almacen a
            LEFT JOIN tipo_almacen ta ON a.id_tipo = ta.id
            LEFT JOIN cuenta_inventario ci ON a.id_cuenta_contable = ci.id
            LEFT JOIN usuario u ON a.id_responsable = u.id
            LEFT JOIN centro_costo cc ON a.id_centro_costo = cc.id
            WHERE a.id = ?
        `;
        const almacen = await pool.query(query, [id]);
        if (almacen.length === 0) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }

        // Misma política que getAllAlmacenes: el nombre del técnico vive en la base externa y, si esa
        // base no está a mano, el almacén se devuelve con ese dato en null.
        let nombreTecnicoExterno = null;
        if (almacen[0].id_tecnico_optiweb) {
            try {
                const personal = await poolExterna.query(
                    `SELECT CODIGO as id, CONCAT(NOMBRES, ' ', APELLIDOS) as nombre_completo
                     FROM personal
                     WHERE CODIGO = ?`,
                    [almacen[0].id_tecnico_optiweb]
                );
                nombreTecnicoExterno = personal.length > 0 ? personal[0].nombre_completo : null;
            } catch (error) {
                console.warn('Base externa no disponible: almacen sin nombre de tecnico:', error.message);
            }
        }

        res.json(handleBigInt({ ...almacen[0], tecnico_optiweb_nombre: nombreTecnicoExterno }));
    } catch (error) {
        console.error('Error en getAlmacenById:', error);
        res.status(500).json({ error: error.message });
    }
};


/--------------------Obtener-Listar almacenes por tipo PRINCIPAL o TECNICO-----------------------------------------------------------------------------------/
exports.getAlmacenesByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        const query = `
            SELECT 
                a.*,
                ta.nombre as tipo_almacen_nombre,
                u.username as responsable_nombre
            FROM almacen a
            LEFT JOIN tipo_almacen ta ON a.id_tipo = ta.id
            LEFT JOIN usuario u ON a.id_responsable = u.id
            WHERE ta.nombre = ? AND a.estado = 'ACTIVO'
            ORDER BY a.nombre
        `;
        const almacenes = await pool.query(query, [tipo]);
        res.json(almacenes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/--------------------Crear Almacen con erificaciones de codigo unico-----------------------------------------------------------------------------------/
exports.createAlmacen = async (req, res) => {
    let conn;
    try {
        const {
            codigo,
            nombre,
            direccion,
            telefono,
            observacion,
            zona,
            estado = 'ACTIVO',
            es_principal = 0,
            es_tecnico = 0,
            capacidad,
            id_cuenta_contable,
            id_tipo,
            id_centro_costo,
            id_tecnico_optiweb = null
        } = req.body;

        // El responsable siempre es el usuario logueado
        const id_responsable = req.user.id;

        if (!codigo || !nombre || !id_tipo) {
            return res.status(400).json({ 
                error: 'Código, nombre y tipo de almacén son obligatorios' 
            });
        }

        conn = await pool.getConnection();

        const existente = await conn.query(
            'SELECT id FROM almacen WHERE codigo = ?', 
            [codigo]
        );
        if (existente.length > 0) {
            return res.status(400).json({ error: 'El código ya existe' });
        }

        if (es_principal) {
            const principalExistente = await conn.query(
                'SELECT id FROM almacen WHERE es_principal = 1 AND estado = "ACTIVO"'
            );
            if (principalExistente.length > 0) {
                return res.status(400).json({ 
                    error: 'Ya existe un almacén principal activo' 
                });
            }
        }

        if (es_tecnico && !id_tecnico_optiweb) {
            return res.status(400).json({ 
                error: 'Para almacenes técnicos debe seleccionar un técnico de la base externa' 
            });
        }

        const query = `
            INSERT INTO almacen (
                codigo, nombre, direccion, telefono, observacion, zona, estado,
                es_principal, es_tecnico, capacidad, id_cuenta_contable, id_tipo,
                id_responsable, id_centro_costo, id_tecnico_optiweb, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await conn.query(query, [
            codigo, nombre, direccion, telefono, observacion, zona, estado,
            es_principal, es_tecnico, capacidad, id_cuenta_contable, id_tipo,
            id_responsable, id_centro_costo, id_tecnico_optiweb, req.user.id
        ]);

        res.status(201).json(handleBigInt({
            id: result.insertId,
            message: 'Almacén creado correctamente',
            codigo: codigo
        }));

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Editar Almacen con validaciones de su codigo Unico-----------------------------------------------------------------------------------/
exports.updateAlmacen = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const {
            codigo,
            nombre,
            direccion,
            telefono,
            observacion,
            zona,
            estado,
            es_principal,
            es_tecnico,
            capacidad,
            id_cuenta_contable,
            id_tipo,
            id_responsable,
            id_centro_costo
        } = req.body;

        conn = await pool.getConnection();

        const existente = await conn.query(
            'SELECT id, es_principal FROM almacen WHERE id = ?', 
            [id]
        );
        if (existente.length === 0) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }

        const codigoExistente = await conn.query(
            'SELECT id FROM almacen WHERE codigo = ? AND id != ?', 
            [codigo, id]
        );
        if (codigoExistente.length > 0) {
            return res.status(400).json({ error: 'El código ya está en uso' });
        }

        if (es_principal && existente[0].es_principal !== 1) {
            const principalExistente = await conn.query(
                'SELECT id FROM almacen WHERE es_principal = 1 AND estado = "ACTIVO" AND id != ?',
                [id]
            );
            if (principalExistente.length > 0) {
                return res.status(400).json({ 
                    error: 'Ya existe un almacén principal activo' 
                });
            }
        }

        const query = `
            UPDATE almacen 
            SET codigo = ?, nombre = ?, direccion = ?, telefono = ?, observacion = ?, 
                zona = ?, estado = ?, es_principal = ?, es_tecnico = ?, capacidad = ?,
                id_cuenta_contable = ?, id_tipo = ?, id_responsable = ?, id_centro_costo = ?,
                updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE id = ?
        `;
        
        await conn.query(query, [
            codigo, nombre, direccion, telefono, observacion, zona, estado,
            es_principal, es_tecnico, capacidad, id_cuenta_contable, id_tipo,
            id_responsable, id_centro_costo, req.user.id, id
        ]);

        res.json({ message: 'Almacén actualizado correctamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Borrar Almacen exceptop el Principal-----------------------------------------------------------------------------------/
exports.deleteAlmacen = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;

        conn = await pool.getConnection();

        const existente = await conn.query(
            'SELECT id, es_principal FROM almacen WHERE id = ?', 
            [id]
        );
        if (existente.length === 0) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }

        if (existente[0].es_principal) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el almacén principal' 
            });
        }

        const inventario = await conn.query(
            'SELECT id FROM inventario WHERE id_almacen = ? AND stock_actual > 0', 
            [id]
        );
        if (inventario.length > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar un almacén con stock' 
            });
        }

        await conn.query(
            'UPDATE almacen SET estado = "INACTIVO", updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?',
            [req.user.id, id]
        );

        res.json({ message: 'Almacén desactivado correctamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
};


/--------------------Opciones para completar formularios-----------------------------------------------------------------------------------/
exports.getOpcionesAlmacen = async (req, res) => {
    console.log("Hola opciones");
    try {
        const [tiposAlmacen, cuentasContables, responsables, centrosCosto] = await Promise.all([
            pool.query('SELECT id, nombre FROM tipo_almacen'),
            pool.query('SELECT id, codigo, nombre FROM cuenta_inventario WHERE activo = 1'),
            pool.query('SELECT id, username FROM usuario WHERE estado = "ACTIVO"'),
            pool.query('SELECT id, codigo, nombre FROM centro_costo WHERE activo = 1')
        ]);

        let personalTecnico = [];
        try {
            if (poolExterna && typeof poolExterna.getConnection === 'function') {
                const conn = await poolExterna.getConnection();
                const query = `
                    SELECT 
                        CODIGO as id,
                        CONCAT(NOMBRES, ' ', APELLIDOS) as nombre_completo,
                        CARGO,
                        ESTADO
                    FROM personal
                    WHERE CARGO IN ('SOPORTE TECNICO', 'INSTALADOR', 'REDES')
                    AND ESTADO = 'ACTIVO'
                    ORDER BY nombre_completo
                `;
                personalTecnico = await conn.query(query);
                conn.release();
            }
        } catch (error) {
            console.warn('No se pudo obtener personal técnico en opciones:', error.message);
            personalTecnico = [];
        }

        res.json({
            tiposAlmacen,
            cuentasContables,
            responsables,
            centrosCosto,
            personalTecnico
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};