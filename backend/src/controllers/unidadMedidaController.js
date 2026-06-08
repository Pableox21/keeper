const { pool } = require('../config/db');

// Obtener todas las unidades de medida
exports.getAllUnidadesMedida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM unidad_medida ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Obtener una unidad de medida por ID
exports.getUnidadMedidaById = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM unidad_medida WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Crear nueva unidad de medida
exports.createUnidadMedida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        let { nombre, abreviatura, tipo, descripcion } = req.body;
        
        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        if (!abreviatura || !abreviatura.trim()) {
            return res.status(400).json({ error: 'Abreviatura requerida' });
        }
        if (!tipo || !tipo.trim()) {
            return res.status(400).json({ error: 'Tipo requerido' });
        }

        nombre = nombre.trim();
        abreviatura = abreviatura.trim().toLowerCase();
        tipo = tipo.trim().toUpperCase();
        descripcion = descripcion ? descripcion.trim() : null;

        // Verificar si ya existe por nombre o abreviatura
        const existe = await conn.query(
            'SELECT id FROM unidad_medida WHERE nombre = ? OR abreviatura = ?', 
            [nombre, abreviatura]
        );
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe una unidad de medida con ese nombre o abreviatura' });
        }

        const result = await conn.query(
            'INSERT INTO unidad_medida (nombre, abreviatura, tipo, descripcion) VALUES (?, ?, ?, ?)',
            [nombre, abreviatura, tipo, descripcion]
        );
        
        res.status(201).json({ 
            id: Number(result.insertId), 
            nombre, 
            abreviatura, 
            tipo, 
            descripcion 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Actualizar unidad de medida
exports.updateUnidadMedida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;
        let { nombre, abreviatura, tipo, descripcion } = req.body;

        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }
        if (!abreviatura || !abreviatura.trim()) {
            return res.status(400).json({ error: 'Abreviatura requerida' });
        }
        if (!tipo || !tipo.trim()) {
            return res.status(400).json({ error: 'Tipo requerido' });
        }

        nombre = nombre.trim();
        abreviatura = abreviatura.trim().toLowerCase();
        tipo = tipo.trim().toUpperCase();
        descripcion = descripcion ? descripcion.trim() : null;

        // Verificar si existe otra unidad con el mismo nombre o abreviatura
        const existe = await conn.query(
            'SELECT id FROM unidad_medida WHERE (nombre = ? OR abreviatura = ?) AND id != ?', 
            [nombre, abreviatura, id]
        );
        if (existe.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra unidad de medida con ese nombre o abreviatura' });
        }

        const result = await conn.query(
            'UPDATE unidad_medida SET nombre = ?, abreviatura = ?, tipo = ?, descripcion = ? WHERE id = ?',
            [nombre, abreviatura, tipo, descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }

        res.json({ id: Number(id), nombre, abreviatura, tipo, descripcion });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};

// Eliminar unidad de medida
exports.deleteUnidadMedida = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { id } = req.params;

        // Verificar si la unidad de medida está siendo usada en productos
        const enUso = await conn.query(
            'SELECT COUNT(*) as count FROM producto WHERE id_unidad_medida = ?', 
            [id]
        );
        
        if (enUso[0].count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar la unidad de medida porque está siendo utilizada por productos' 
            });
        }

        const result = await conn.query('DELETE FROM unidad_medida WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }

        res.json({ message: 'Unidad de medida eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
};