const { pool } = require('./db');

// Cambios de esquema que el sistema necesita. Se aplican solos al arrancar el backend y son seguros
// de repetir (si ya están aplicados, no hacen nada). Equivalen a las migraciones 008 a 012 de database/migrations.

const ROLES_PERMITIDOS = ['ADMIN', 'ALMACEN', 'ATENCION_CLIENTE'];

// Roles eliminados. Las cuentas que los tengan pasan a ALMACEN y quedan deshabilitadas:
// nadie conserva acceso por una migración, un ADMIN reactiva y reasigna si corresponde.
const ROLES_RETIRADOS = ['SUPERVISOR', 'USUARIO', 'SOLO_LECTURA'];
const ROL_REEMPLAZO = 'ALMACEN';
const ROL_POR_DEFECTO = 'ALMACEN';

// Migraciones 008 a 011: la restricción chk_usuario_rol debe permitir exactamente ROLES_PERMITIDOS
// y la columna rol no debe defectear un rol inexistente.
async function ensureRolesUsuario(conn) {
    const rows = await conn.query(
        `SELECT CHECK_CLAUSE
         FROM information_schema.CHECK_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario' AND CONSTRAINT_NAME = 'chk_usuario_rol'`
    );
    const columna = await conn.query(
        `SELECT COLUMN_DEFAULT
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario' AND COLUMN_NAME = 'rol'`
    );
    const defectoActual = columna.length > 0 ? String(columna[0].COLUMN_DEFAULT ?? '') : null;

    if (rows.length > 0 && defectoActual === ROL_POR_DEFECTO) {
        const actuales = [...String(rows[0].CHECK_CLAUSE).matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
        const esperados = [...ROLES_PERMITIDOS].sort();
        const igual = actuales.length === esperados.length && actuales.every((rol, i) => rol === esperados[i]);
        if (igual) return;
    }

    const retirados = ROLES_RETIRADOS.map(() => '?').join(',');
    await conn.query(
        `UPDATE usuario SET rol = ?, estado = 'INACTIVO' WHERE rol IN (${retirados})`,
        [ROL_REEMPLAZO, ...ROLES_RETIRADOS]
    );

    if (rows.length > 0) {
        await conn.query('ALTER TABLE usuario DROP CONSTRAINT chk_usuario_rol');
    }
    const lista = ROLES_PERMITIDOS.map((r) => `'${r}'`).join(',');
    await conn.query(`ALTER TABLE usuario ADD CONSTRAINT chk_usuario_rol CHECK (rol IN (${lista}))`);
    await conn.query(`ALTER TABLE usuario ALTER COLUMN rol SET DEFAULT '${ROL_POR_DEFECTO}'`);
    console.log(`Esquema: roles de usuario actualizados a ${ROLES_PERMITIDOS.join(', ')}`);
}

// Migración 009: tabla propia del módulo de clientes (la tabla `cliente` original no se toca)
async function ensureClienteInternet(conn) {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS cliente_internet (
            id int(11) NOT NULL AUTO_INCREMENT,
            numero_contrato varchar(30) NOT NULL,
            nombre_completo varchar(255) NOT NULL,
            ci varchar(10) NOT NULL,
            ci_complemento varchar(3) DEFAULT NULL,
            celular varchar(8) NOT NULL,
            zona varchar(20) NOT NULL,
            plan varchar(20) NOT NULL,
            estado varchar(20) NOT NULL DEFAULT 'ACTIVO',
            created_at timestamp NULL DEFAULT current_timestamp(),
            updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY uk_cliente_internet_contrato (numero_contrato),
            KEY idx_cliente_internet_ci (ci),
            KEY idx_cliente_internet_zona (zona),
            KEY idx_cliente_internet_plan (plan),
            KEY idx_cliente_internet_estado (estado),
            CONSTRAINT chk_cliente_internet_zona CHECK (zona IN ('SIPE_SIPE','SUTICOLLO','MALLCO_CHAPI')),
            CONSTRAINT chk_cliente_internet_plan CHECK (plan IN ('ECONOMICO','MEDIO','PREMIUM','GAMER')),
            CONSTRAINT chk_cliente_internet_estado CHECK (estado IN ('ACTIVO','INACTIVO'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

// Migración 012: traspaso debe tener las columnas de auditoría que usan PUT /:id y PATCH /:id/estado
async function ensureTraspasoAuditoria(conn) {
    const columnas = await conn.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'traspaso' AND COLUMN_NAME IN ('updated_at', 'updated_by')`
    );
    const tienen = new Set(columnas.map((c) => String(c.COLUMN_NAME).toLowerCase()));
    if (tienen.has('updated_at') && tienen.has('updated_by')) return;

    if (!tienen.has('updated_at')) {
        await conn.query('ALTER TABLE traspaso ADD COLUMN `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()');
    }
    if (!tienen.has('updated_by')) {
        await conn.query('ALTER TABLE traspaso ADD COLUMN `updated_by` int(11) DEFAULT NULL');
    }
    const claves = await conn.query(
        `SELECT CONSTRAINT_NAME
         FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'traspaso' AND CONSTRAINT_NAME = 'fk_traspaso_updated_by'`
    );
    if (claves.length === 0) {
        await conn.query('ALTER TABLE traspaso ADD CONSTRAINT fk_traspaso_updated_by FOREIGN KEY (`updated_by`) REFERENCES usuario (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
    }
    console.log('Esquema: traspaso con columnas updated_at / updated_by');
}

// Cada paso es independiente: si uno falla se informa y se continúa con el siguiente.
async function ensureSchema() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Si otra conexión tiene bloqueada una tabla, falla en 15 s en lugar de esperar horas
        await conn.query('SET SESSION lock_wait_timeout = 15');

        for (const [nombre, paso] of [
            ['roles de usuario', ensureRolesUsuario],
            ['tabla cliente_internet', ensureClienteInternet],
            ['columnas de auditoría de traspaso', ensureTraspasoAuditoria],
            ['columnas de auditoría de traspaso', ensureTraspasoAuditoria],
        ]) {
            try {
                await paso(conn);
            } catch (error) {
                console.error(`Esquema: no se pudo aplicar "${nombre}":`, error.message);
            }
        }
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { ensureSchema };
