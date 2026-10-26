const { ensureSchema } = require('./ensureSchema');
const { ensureDefaultUser } = require('./defaultUser');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ejecuta una tarea reintentando (la base de datos puede tardar unos segundos en estar lista).
// Nunca lanza error: si agota los intentos, lo informa y devuelve false.
async function withRetry(nombre, tarea, { intentos = 10, espera = 3000 } = {}) {
    for (let intento = 1; intento <= intentos; intento++) {
        try {
            await tarea();
            return true;
        } catch (error) {
            console.error(`${nombre} falló (intento ${intento}/${intentos}): ${error.message}`);
            if (intento < intentos) await sleep(espera);
        }
    }
    console.error(`${nombre}: no se pudo completar. Revisa la conexión con la base de datos.`);
    return false;
}

// Prepara la base de datos DESPUÉS de levantar el servidor, para que la API siempre responda.
async function prepareDatabase(options) {
    await withRetry('Esquema de la base de datos', ensureSchema, options);
    await withRetry('Usuario por defecto', ensureDefaultUser, options);
    console.log('Base de datos lista');
}

module.exports = { prepareDatabase, withRetry };
