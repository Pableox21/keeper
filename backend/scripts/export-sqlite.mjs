/**
 * Vuelca una base de datos de Keeper (MariaDB en Docker) a un archivo .sqlite
 * para abrirlo con DB Browser for SQLite, que no sabe conectarse a MariaDB.
 *
 * Uso (con el stack levantado):
 *   node backend/scripts/export-sqlite.mjs                 -> keeper -> database/export/keeper.sqlite
 *   node backend/scripts/export-sqlite.mjs externa         -> empresa_externa -> database/export/empresa_externa.sqlite
 *   node backend/scripts/export-sqlite.mjs --host=127.0.0.1 --port=3310 --salida=otra-ruta.sqlite
 *
 * El archivo de salida es una foto fija: hay que relanzar el script para ver los datos nuevos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'mariadb';
import { DatabaseSync } from 'node:sqlite';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const argv = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
    const prefijo = `--${nombre}=`;
    const encontrada = argv.find((a) => a.startsWith(prefijo));
    return encontrada ? encontrada.slice(prefijo.length) : porDefecto;
};

const destinos = {
    keeper: { variables: ['DB_USER', 'DB_PASSWORD', 'DB_NAME'], archivo: 'keeper.sqlite' },
    externa: { variables: ['DB_EXTERNA_USER', 'DB_EXTERNA_PASSWORD', 'DB_EXTERNA_NAME'], archivo: 'empresa_externa.sqlite' },
};

const alias = argv.find((a) => !a.startsWith('--')) ?? 'keeper';
const destino = destinos[alias];
if (!destino) {
    console.error(`Esquema desconocido "${alias}". Usa: ${Object.keys(destinos).join(', ')}`);
    process.exit(1);
}

const archivoEnv = path.join(raiz, '.env');
if (fs.existsSync(archivoEnv)) process.loadEnvFile(archivoEnv);

const [variableUsuario, variableContraseña, variableBase] = destino.variables;
const configuracion = {
    host: opcion('host', '127.0.0.1'),
    port: Number(opcion('port', '3310')),
    user: process.env[variableUsuario],
    password: process.env[variableContraseña],
    database: process.env[variableBase],
};
if (!configuracion.user || !configuracion.database) {
    console.error(`Faltan ${variableUsuario}/${variableBase} en ${archivoEnv}`);
    process.exit(1);
}

const salida = opcion('salida', path.join(raiz, 'database', 'export', destino.archivo));

// El driver espera ~1 s el handshake TCP por defecto y con el puerto publicado por Docker en Windows
// a veces no llega; además conviene un mensaje claro si la base no está arriba.
configuracion.connectTimeout = 10000;

let mariadb;
try {
    mariadb = await createConnection(configuracion);
} catch (error) {
    console.error(`No se puede conectar a ${configuracion.host}:${configuracion.port} (${error.message}).`
        + ' Levanta el stack con `docker compose up -d` y revisa las variables del .env.');
    process.exit(1);
}

// MariaDB responde con tipos que SQLite no acepta tal cual (Date, BigInt, booleans, JSON).
function aValorSqlite(valor) {
    if (valor === null || valor === undefined) return null;
    if (valor instanceof Date) {
        const dos = (n) => String(n).padStart(2, '0');
        let texto = `${valor.getFullYear()}-${dos(valor.getMonth() + 1)}-${dos(valor.getDate())} `
            + `${dos(valor.getHours())}:${dos(valor.getMinutes())}:${dos(valor.getSeconds())}`;
        if (valor.getMilliseconds()) texto += `.${String(valor.getMilliseconds()).padStart(3, '0')}`;
        return texto;
    }
    if (Buffer.isBuffer(valor) || valor instanceof Uint8Array) return valor;
    if (typeof valor === 'bigint') return Number.isSafeInteger(Number(valor)) ? Number(valor) : valor.toString();
    if (typeof valor === 'boolean') return valor ? 1 : 0;
    if (typeof valor === 'object') return JSON.stringify(valor);
    return valor;
}

function aTipoSqlite(dataType) {
    if (['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'bit', 'year'].includes(dataType)) return 'INTEGER';
    if (['decimal', 'numeric', 'float', 'double', 'real'].includes(dataType)) return 'NUMERIC';
    if (['blob', 'tinyblob', 'mediumblob', 'longblob', 'binary', 'varbinary'].includes(dataType)) return 'BLOB';
    return 'TEXT';
}

function comillas(nombre) {
    return `"${nombre.replaceAll('"', '""')}"`;
}

fs.mkdirSync(path.dirname(salida), { recursive: true });

// En Windows no se puede borrar un .sqlite que DB Browser tiene abierto, así que el archivo
// existente se reusa: se vacían sus tablas y se vuelven a crear con el estado actual de la base.
let sqlite;
try {
    sqlite = new DatabaseSync(salida);
} catch (error) {
    console.error(`No se puede escribir en ${salida}: ${error.message}`);
    await mariadb.end();
    process.exit(1);
}

console.log(`Exportando ${configuracion.database} (${configuracion.host}:${configuracion.port}) -> ${salida}`);

try {
    sqlite.exec('PRAGMA busy_timeout = 5000');

    for (const { name } of sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()) {
        sqlite.exec(`DROP TABLE IF EXISTS ${comillas(name)}`);
    }

    const tablas = await mariadb.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
        [configuracion.database]
    );

    let totalRegistros = 0;
    for (const { TABLE_NAME: tabla } of tablas) {
        const columnas = await mariadb.query(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
             FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [configuracion.database, tabla]
        );
        const claves = columnas.filter((c) => c.COLUMN_KEY === 'PRI').map((c) => c.COLUMN_NAME);

        const definicion = columnas.map((c) => {
            const tipo = aTipoSqlite(c.DATA_TYPE);
            const nulo = c.IS_NULLABLE === 'YES' || (claves.length === 1 && claves[0] === c.COLUMN_NAME) ? '' : ' NOT NULL';
            return `${comillas(c.COLUMN_NAME)} ${tipo}${nulo}`;
        });
        if (claves.length > 1) definicion.push(`PRIMARY KEY (${claves.map(comillas).join(', ')})`);

        sqlite.exec(`CREATE TABLE ${comillas(tabla)} (\n  ${definicion.join(',\n  ')}\n)`);

        const nombres = columnas.map((c) => c.COLUMN_NAME);
        const registros = await mariadb.query(
            `SELECT ${nombres.map((n) => `\`${n}\``).join(', ')} FROM \`${tabla}\``
        );

        const sentencia = sqlite.prepare(
            `INSERT INTO ${comillas(tabla)} (${nombres.map(comillas).join(', ')}) `
            + `VALUES (${nombres.map(() => '?').join(', ')})`
        );
        sqlite.exec('BEGIN');
        for (const registro of registros) {
            sentencia.run(...nombres.map((n) => aValorSqlite(registro[n])));
        }
        sqlite.exec('COMMIT');

        totalRegistros += registros.length;
        console.log(`  ${tabla}: ${registros.length}`);
    }

    console.log(`${tablas.length} tablas, ${totalRegistros} registros exportados.`);
} catch (error) {
    const bloqueado = /database is locked|SQLITE_BUSY/i.test(error.message);
    console.error(bloqueado
        ? `${salida} está bloqueado por otro programa. En DB Browser usa Archivo > Cerrar base de datos y relanza el script.`
        : `El volcado se interrumpió: ${error.message}`);
    process.exitCode = 1;
} finally {
    sqlite.close();
    await mariadb.end();
}
