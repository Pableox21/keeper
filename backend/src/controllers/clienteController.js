const { pool } = require('../config/db');

const ZONAS = ['SIPE_SIPE', 'SUTICOLLO', 'MALLCO_CHAPI'];
const PLANES = ['ECONOMICO', 'MEDIO', 'PREMIUM', 'GAMER'];
const ESTADOS = ['ACTIVO', 'INACTIVO'];

// Nombre: solo letras (con tildes y ñ), espacios y los signos . ' -
const NOMBRE_REGEX = /^\p{L}[\p{L}\s.'’-]*$/u;

const CLIENTE_FIELDS = `id, numero_contrato, nombre_completo, ci, ci_complemento, celular, zona, plan, estado, created_at`;

// Valida y normaliza los datos del cliente. Devuelve { data } o { error }.
function validateCliente(body = {}) {
    const numero_contrato = String(body.numero_contrato ?? '').trim();
    const nombre_completo = String(body.nombre_completo ?? '').trim().replace(/\s+/g, ' ');
    const ci = String(body.ci ?? '').trim();
    const ci_complemento = String(body.ci_complemento ?? '').trim().toUpperCase();
    const celular = String(body.celular ?? '').trim();
    const zona = String(body.zona ?? '').trim().toUpperCase();
    const plan = String(body.plan ?? '').trim().toUpperCase();

    if (!numero_contrato) return { error: 'El número de contrato es requerido' };
    if (numero_contrato.length > 30) return { error: 'El número de contrato no puede superar los 30 caracteres' };
    if (!nombre_completo) return { error: 'El nombre completo es requerido' };
    if (nombre_completo.length < 3) return { error: 'El nombre completo debe tener al menos 3 caracteres' };
    if (nombre_completo.length > 255) return { error: 'El nombre completo es demasiado largo' };
    if (!NOMBRE_REGEX.test(nombre_completo)) {
        return { error: 'El nombre completo solo puede contener letras y espacios (sin números ni símbolos)' };
    }
    if (!/^\d{5,10}$/.test(ci)) return { error: 'El CI debe tener entre 5 y 10 dígitos' };
    if (ci_complemento && !/^[A-Z0-9]{1,3}$/.test(ci_complemento)) {
        return { error: 'El complemento del CI debe tener entre 1 y 3 letras o números' };
    }
    if (!/^[67]\d{7}$/.test(celular)) return { error: 'El celular debe tener 8 dígitos y empezar con 6 o 7' };
    if (!ZONAS.includes(zona)) return { error: 'Zona inválida' };
    if (!PLANES.includes(plan)) return { error: 'Plan de internet inválido' };

    return {
        data: {
            numero_contrato,
            nombre_completo,
            ci,
            ci_complemento: ci_complemento || null,
            celular,
            zona,
            plan
        }
    };
}

// Serializa un registro (los ids pueden llegar como BigInt)
const serialize = (row) => ({ ...row, id: Number(row.id) });


//////////////////////////////////////// LISTAR CLIENTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getAllClientes = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet ORDER BY id DESC`);
        res.json(rows.map(serialize));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// CREAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createCliente = async (req, res) => {
    let conn;
    try {
        const { error, data } = validateCliente(req.body);
        if (error) return res.status(400).json({ error });

        conn = await pool.getConnection();

        const exists = await conn.query('SELECT id FROM cliente_internet WHERE numero_contrato = ?', [data.numero_contrato]);
        if (exists.length > 0) return res.status(400).json({ error: 'El número de contrato ya está registrado' });

        const result = await conn.query(
            `INSERT INTO cliente_internet (numero_contrato, nombre_completo, ci, ci_complemento, celular, zona, plan)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.numero_contrato, data.nombre_completo, data.ci, data.ci_complemento, data.celular, data.zona, data.plan]
        );

        const rows = await conn.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet WHERE id = ?`, [Number(result.insertId)]);
        res.status(201).json(serialize(rows[0]));
    } catch (err) {
        if (err.errno === 1062) return res.status(400).json({ error: 'El número de contrato ya está registrado' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// EDITAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.updateCliente = async (req, res) => {
    let conn;
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id inválido' });

        const { error, data } = validateCliente(req.body);
        if (error) return res.status(400).json({ error });

        conn = await pool.getConnection();

        const current = await conn.query('SELECT id FROM cliente_internet WHERE id = ?', [id]);
        if (current.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        const duplicated = await conn.query(
            'SELECT id FROM cliente_internet WHERE numero_contrato = ? AND id <> ?',
            [data.numero_contrato, id]
        );
        if (duplicated.length > 0) return res.status(400).json({ error: 'El número de contrato ya está registrado' });

        await conn.query(
            `UPDATE cliente_internet
             SET numero_contrato = ?, nombre_completo = ?, ci = ?, ci_complemento = ?, celular = ?, zona = ?, plan = ?
             WHERE id = ?`,
            [data.numero_contrato, data.nombre_completo, data.ci, data.ci_complemento, data.celular, data.zona, data.plan, id]
        );

        const rows = await conn.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet WHERE id = ?`, [id]);
        res.json(serialize(rows[0]));
    } catch (err) {
        if (err.errno === 1062) return res.status(400).json({ error: 'El número de contrato ya está registrado' });
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// ACTIVAR / DESACTIVAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.setClienteEstado = async (req, res) => {
    let conn;
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id inválido' });
        if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

        conn = await pool.getConnection();

        const rows = await conn.query('SELECT id FROM cliente_internet WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        await conn.query('UPDATE cliente_internet SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ id, estado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};


//////////////////////////////////////// ELIMINAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.deleteCliente = async (req, res) => {
    let conn;
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Id inválido' });

        conn = await pool.getConnection();

        const rows = await conn.query('SELECT id FROM cliente_internet WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        await conn.query('DELETE FROM cliente_internet WHERE id = ?', [id]);
        res.json({ id, eliminado: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};
