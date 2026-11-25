const { pool } = require('../config/db');
const { responderErrorBase } = require('../utils/erroresBase');

// Las reglas del cliente viven en `middleware/validate.js` (validateCliente), que además normaliza
// los campos: el controlador solo escribe lo que ya vino válido.
function responderErrorCliente(res, err, contexto) {
    return responderErrorBase(res, err, contexto, {
        duplicado: 'El número de contrato ya está registrado',
        check: 'La zona, el plan o el estado del cliente no son valores permitidos',
        generico: 'No se pudo completar la operación con el cliente'
    });
}

const CLIENTE_FIELDS = `id, numero_contrato, nombre_completo, ci, ci_complemento, celular, zona, plan, estado, created_at`;

// Serializa un registro (los ids pueden llegar como BigInt)
const serialize = (row) => (row ? { ...row, id: Number(row.id) } : row);

const cuerpoCliente = (b) => [
    b.numero_contrato,
    b.nombre_completo,
    b.ci,
    b.ci_complemento || null,
    b.celular,
    b.zona,
    b.plan
];


//////////////////////////////////////// LISTAR CLIENTES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getAllClientes = async (req, res) => {
    try {
        const rows = await pool.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet ORDER BY id DESC`);
        res.json(rows.map(serialize));
    } catch (err) {
        responderErrorCliente(res, err, 'getAllClientes');
    }
};


//////////////////////////////////////// CREAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createCliente = async (req, res) => {
    try {
        const datos = cuerpoCliente(req.body);
        const result = await pool.query(
            `INSERT INTO cliente_internet (numero_contrato, nombre_completo, ci, ci_complemento, celular, zona, plan)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            datos
        );

        const rows = await pool.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet WHERE id = ?`, [Number(result.insertId)]);
        res.status(201).json(serialize(rows[0]));
    } catch (err) {
        responderErrorCliente(res, err, 'createCliente');
    }
};


//////////////////////////////////////// EDITAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.updateCliente = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const datos = cuerpoCliente(req.body);

        const result = await pool.query(
            `UPDATE cliente_internet
             SET numero_contrato = ?, nombre_completo = ?, ci = ?, ci_complemento = ?, celular = ?, zona = ?, plan = ?
             WHERE id = ?`,
            [...datos, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        const rows = await pool.query(`SELECT ${CLIENTE_FIELDS} FROM cliente_internet WHERE id = ?`, [id]);
        res.json(serialize(rows[0]));
    } catch (err) {
        responderErrorCliente(res, err, 'updateCliente');
    }
};


//////////////////////////////////////// ACTIVAR / DESACTIVAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.setClienteEstado = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        const result = await pool.query('UPDATE cliente_internet SET estado = ? WHERE id = ?', [estado, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        res.json({ id, estado });
    } catch (err) {
        responderErrorCliente(res, err, 'setClienteEstado');
    }
};


//////////////////////////////////////// ELIMINAR CLIENTE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.deleteCliente = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query('DELETE FROM cliente_internet WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        res.json({ id, eliminado: true });
    } catch (err) {
        responderErrorCliente(res, err, 'deleteCliente');
    }
};

