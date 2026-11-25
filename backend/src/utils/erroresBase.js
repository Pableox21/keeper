// Traduce un error de MariaDB en una respuesta 400 con texto útil. El SQL crudo solo va al log:
// si se devuelve tal cual, la pantalla muestra `Unknown column ...` o el nombre de una restricción.
//   1062 clave única duplicada · 1452 clave foránea inexistente · 1451 borrado con dependencias · 4025 CHECK
function responderErrorBase(res, err, contexto, textos) {
    const mensajes = {
        1062: textos.duplicado,
        1452: textos.foranea,
        1451: textos.referencia,
        4025: textos.check
    };
    const mensaje = mensajes[err && err.errno];
    if (mensaje) return res.status(400).json({ error: mensaje });

    console.error(`${contexto}:`, err);
    return res.status(500).json({ error: textos.generico });
}

module.exports = { responderErrorBase };
