const { pool } = require('../config/db');
const toNumber = (v) => (typeof v === 'bigint' ? Number(v) : v);

////////////////////// Obtener Todos los Proveedores///////////////////////////////////////////////////////////////////////////////////////////////
exports.getAllProveedores = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { autorizado } = req.query;
        let sql = `SELECT p.id, p.cod, p.nombre, p.nit, p.direccion, p.ciudad, p.zona,
                  p.comentario, p.autorizado, p.id_tipodoc, td.nombre AS tipo_doc_nombre,
                  p.created_at, p.updated_at
           FROM proveedor p
           LEFT JOIN tipo_doc td ON p.id_tipodoc = td.id`;
        const params = [];
        if (autorizado !== undefined) {
            sql += ' WHERE autorizado = ?';
            params.push(Number(autorizado) ? 1 : 0);
        }
        sql += ' ORDER BY nombre';
        const rows = await conn.query(sql, params);
        const safe = rows.map(r => ({ ...r, id: Number(r.id) }));
        res.json(safe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


////////////////////// Obtener Proveedor por ID///////////////////////////////////////////////////////////////////////////////////////////////
exports.getProveedorById = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SELECT p.id, p.cod, p.nombre, p.nit, p.direccion, p.ciudad, p.zona,
                    p.comentario, p.autorizado, p.id_tipodoc, td.nombre AS tipo_doc_nombre,
                    p.created_at, p.updated_at
            FROM proveedor p
            LEFT JOIN tipo_doc td ON p.id_tipodoc = td.id
            WHERE p.id = ?`,
            [id]
        );
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });

        const prov = rows[0];
        const emails = await conn.query('SELECT id, email, tipo FROM proveedor_email WHERE id_proveedor = ?', [id]);
        const telefonos = await conn.query('SELECT id, telefono, tipo FROM proveedor_telefono WHERE id_proveedor = ?', [id]);

        res.json({
            ...prov,
            id: Number(prov.id),
            id_tipodoc: prov.id_tipodoc ? Number(prov.id_tipodoc) : null,
            tipo_doc_nombre: prov.tipo_doc_nombre || null,
            emails,
            telefonos
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


/////////////////////// Crear proveedor acepta arrays { emails: [{email,tipo}], telefonos: [{telefono,tipo}] }///////////////////////////////////////////////////////////////////////////////////////////////
exports.createProveedor = async (req, res) => {
    let conn;
    try {
        const {
            cod, nombre, nit, direccion, ciudad, zona, comentario,
            autorizado = 1, id_tipodoc = null,
            emails = [], telefonos = []
        } = req.body;

        if (!cod || !nombre) return res.status(400).json({ error: 'cod y nombre son requeridos' });

        conn = await pool.getConnection();
        if (id_tipodoc) {
            const td = await conn.query('SELECT id FROM tipo_doc WHERE id = ?', [id_tipodoc]);
            if (!td || td.length === 0) {
                return res.status(400).json({ error: 'id_tipodoc inválido' });
            }
        }
        const dup = await conn.query('SELECT id FROM proveedor WHERE cod = ? OR (nit IS NOT NULL AND nit = ?)', [cod, nit || null]);
        if (dup.length > 0) return res.status(400).json({ error: 'cod o nit ya registrado' });

        const result = await conn.query(
            'INSERT INTO proveedor (cod, nombre, nit, direccion, ciudad, zona, comentario, autorizado, id_tipodoc, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [cod, nombre, nit || null, direccion || null, ciudad || null, zona || null, comentario || null, autorizado ? 1 : 0, id_tipodoc || null, req.user ? req.user.id : null]
        );

        const newId = toNumber(result.insertId);

        if (Array.isArray(emails) && emails.length > 0) {
            for (const e of emails) {
                if (!e.email) continue;
                await conn.query('INSERT IGNORE INTO proveedor_email (id_proveedor, email, tipo) VALUES (?, ?, ?)', [newId, e.email, e.tipo || 'COMERCIAL']);
            }
        }

        if (Array.isArray(telefonos) && telefonos.length > 0) {
            for (const t of telefonos) {
                if (!t.telefono) continue;
                await conn.query('INSERT IGNORE INTO proveedor_telefono (id_proveedor, telefono, tipo) VALUES (?, ?, ?)', [newId, t.telefono, t.tipo || 'PRINCIPAL']);
            }
        }

        res.status(201).json({ id: newId, cod, nombre });
    } catch (err) {
        if (err && err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Entrada duplicada' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


////////////////////// ACTUALIZAR PROVEEDOR ///////////////////////////////////////////////////////////////////////////////////////////////
exports.updateProveedor = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const {
            cod, nombre, nit, direccion, ciudad, zona, comentario,
            autorizado, id_tipodoc,
            emails = null, telefonos = null
        } = req.body;

        conn = await pool.getConnection();

        const rows = await conn.query('SELECT id FROM proveedor WHERE id = ?', [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });

        if (cod) {
            const dup = await conn.query('SELECT id FROM proveedor WHERE cod = ? AND id != ?', [cod, id]);
            if (dup.length > 0) return res.status(400).json({ error: 'cod ya en uso por otro proveedor' });
        }
        if (nit) {
            const dup2 = await conn.query('SELECT id FROM proveedor WHERE nit = ? AND id != ?', [nit, id]);
            if (dup2.length > 0) return res.status(400).json({ error: 'nit ya en uso por otro proveedor' });
        }

        if (typeof id_tipodoc !== 'undefined' && id_tipodoc !== null) {
            const td = await conn.query('SELECT id FROM tipo_doc WHERE id = ?', [id_tipodoc]);
            if (!td || td.length === 0) {
                return res.status(400).json({ error: 'id_tipodoc inválido' });
            }
        }

        const updateSql = `UPDATE proveedor SET
            cod = COALESCE(?, cod),
            nombre = COALESCE(?, nombre),
            nit = COALESCE(?, nit),
            direccion = COALESCE(?, direccion),
            ciudad = COALESCE(?, ciudad),
            zona = COALESCE(?, zona),
            comentario = COALESCE(?, comentario),
            autorizado = COALESCE(?, autorizado),
            id_tipodoc = COALESCE(?, id_tipodoc),
            updated_by = ?
            WHERE id = ?`;
        await conn.query(updateSql, [
            cod || null, nombre || null, nit || null, direccion || null, ciudad || null, zona || null, comentario || null,
            (typeof autorizado === 'undefined' ? null : (autorizado ? 1 : 0)),
            id_tipodoc || null, req.user ? req.user.id : null, id
        ]);

        if (Array.isArray(emails)) {
            await conn.query('DELETE FROM proveedor_email WHERE id_proveedor = ?', [id]);
            for (const e of emails) {
                if (!e.email) continue;
                await conn.query('INSERT IGNORE INTO proveedor_email (id_proveedor, email, tipo) VALUES (?, ?, ?)', [id, e.email, e.tipo || 'COMERCIAL']);
            }
        }

        if (Array.isArray(telefonos)) {
            await conn.query('DELETE FROM proveedor_telefono WHERE id_proveedor = ?', [id]);
            for (const t of telefonos) {
                if (!t.telefono) continue;
                await conn.query('INSERT IGNORE INTO proveedor_telefono (id_proveedor, telefono, tipo) VALUES (?, ?, ?)', [id, t.telefono, t.tipo || 'PRINCIPAL']);
            }
        }

        res.json({ message: 'Proveedor actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


////////////////////// Borrar proveedor OJO///////////////////////////////////////////////////////////////////////////////////////////////
exports.deleteProveedor = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM proveedor WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ message: 'Proveedor eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////// AUTORIZADO (1 o 0)//////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.setAutorizado = async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { autorizado } = req.body;
        if (typeof autorizado === 'undefined') return res.status(400).json({ error: 'campo autorizado requerido' });

        conn = await pool.getConnection();
        await conn.query('UPDATE proveedor SET autorizado = ?, updated_by = ? WHERE id = ?', [(autorizado ? 1 : 0), req.user ? req.user.id : null, id]);
        res.json({ message: 'Estado de autorización actualizado', autorizado: autorizado ? 1 : 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn && conn.release();
    }
};
