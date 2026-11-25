// Utilidades de stock compartidas por los controladores de movimientos (ingresos, salidas, traspasos).

// Devuelve las líneas cuyo stock disponible no alcanza la cantidad pedida en ese almacén.
async function productosConStockInsuficiente(conn, detalles, idAlmacen) {
    const faltantes = [];
    for (const detalle of detalles) {
        const filas = await conn.query(`
            SELECT i.stock_actual, p.nombre
            FROM inventario i
            INNER JOIN producto p ON p.id = i.id_producto
            WHERE i.id_producto = ? AND i.id_almacen = ?
        `, [Number(detalle.id_producto), Number(idAlmacen)]);

        const cantidad = Number(detalle.cantidad);
        const disponible = filas.length ? Number(filas[0].stock_actual) : 0;
        if (disponible < cantidad) {
            faltantes.push({ nombre: filas.length ? filas[0].nombre : `#${detalle.id_producto}`, disponible, cantidad });
        }
    }
    return faltantes;
}

const primeroFaltante = (faltantes) => {
    const primero = faltantes[0];
    const resto = faltantes.length > 1 ? ` (y ${faltantes.length - 1} producto(s) más)` : '';
    return { primero, resto };
};

// Falta stock para moverlo ahora (registrar o completar un movimiento).
const mensajeStockFaltante = (accion, faltantes) => {
    const { primero, resto } = primeroFaltante(faltantes);
    return `No se puede ${accion}: el producto "${primero.nombre}" solo tiene ${primero.disponible} unidad(es) en el almacén y se pedían ${primero.cantidad}${resto}`;
};

// El stock que se quiere deshacer ya se consumió (editar, eliminar o cancelar un movimiento).
const mensajeStockInsuficiente = (accion, faltantes, registro) => {
    const { primero, resto } = primeroFaltante(faltantes);
    return `No se puede ${accion}: el producto "${primero.nombre}" solo tiene ${primero.disponible} unidad(es) en el almacén y ${registro} registró ${primero.cantidad}${resto}. Registre primero las salidas o traspasos correspondientes`;
};

module.exports = { productosConStockInsuficiente, mensajeStockFaltante, mensajeStockInsuficiente };
