const { Validator } = require('../utils/validator');

// Estos middlewares validan y NORMALIZAN req.body antes de llegar al controlador:
// si algo es inválido responden 400 con un mensaje claro; si todo está bien, el controlador
// recibe los datos ya limpios (sin espacios sobrantes, números como número, etc.).

const ESTADOS_PRODUCTO = ['ACTIVO', 'INACTIVO', 'DESCONTINUADO'];
const ESTADOS_ALMACEN = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];
const TIPOS_UNIDAD = ['PESO', 'VOLUMEN', 'LONGITUD', 'AREA', 'UNIDAD', 'TIEMPO'];
const FORMAS_PAGO = ['EFECTIVO', 'QR', 'TRANSFERENCIA'];
const ESTADOS_MATERIAL = ['NUEVO', 'USADO', 'REACONDICIONADO'];

const MAX_DETALLES = 200;
const MAX_CANTIDAD = 1000000;
const MAX_PRECIO = 100000000;

const make = (rules) => (req, res, next) => {
    const b = req.body;
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
        return res.status(400).json({ error: 'Datos de la solicitud inválidos' });
    }
    const v = new Validator();
    rules(v, b, req);
    if (v.error) return res.status(400).json({ error: v.error });
    next();
};

// Asigna solo si el valor llegó (evita pisar con null campos que el controlador deja intactos)
const setIfPresent = (b, key, value) => {
    if (value !== null && value !== undefined) b[key] = value;
};

// ---------- Id de la URL (/:id) ----------
exports.validateIdParam = (req, res, next, value) => {
    if (!/^[1-9]\d{0,9}$/.test(String(value))) {
        return res.status(400).json({ error: 'Id inválido' });
    }
    next();
};

// ---------- Login ----------
exports.validateLogin = make((v, b) => {
    b.username = v.text(b.username, 'El usuario', { required: true, max: 255 });
    if (typeof b.password !== 'string' || b.password === '') {
        v.fail('La contraseña es requerida');
    } else if (b.password.length > 200) {
        v.fail('La contraseña no puede superar los 200 caracteres');
    }
});

// ---------- Productos ----------
// `unidad_ingreso` no se recibe: el controlador la deriva del nombre de `id_unidad_medida`,
// porque es una columna de texto que otras pantallas muestran como si fuera el nombre.
exports.validateProducto = (isUpdate = false) => make((v, b) => {
    delete b.unidad_ingreso;

    // En la edición solo se validan los campos que llegaron; el controlador conserva el resto
    const has = (key) => !isUpdate || b[key] !== undefined;

    if (has('codigo')) b.codigo = v.code(b.codigo, 'El código', { required: true, max: 50 });
    if (has('nombre')) b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });

    const stockMin = v.int(b.stock_minimo, 'El stock mínimo', { min: 0, max: 1000000000 });
    const stockMax = v.int(b.stock_maximo, 'El stock máximo', { min: 0, max: 1000000000 });
    if (has('stock_minimo')) b.stock_minimo = stockMin ?? 0;
    if (has('stock_maximo')) b.stock_maximo = stockMax;
    if (stockMax !== null && stockMax < (b.stock_minimo ?? 0)) {
        v.fail('El stock máximo no puede ser menor al stock mínimo');
    }

    if (has('estado')) {
        // El valor vacío del selector significa ACTIVO
        b.estado = v.oneOf(b.estado, 'El estado', ESTADOS_PRODUCTO) ?? 'ACTIVO';
    }

    if (has('precio_venta')) {
        const precio = v.number(b.precio_venta, 'El precio de venta', { min: 0, max: MAX_PRECIO });
        // Se guarda con 2 decimales, igual que lo haría la base de datos
        b.precio_venta = precio === null ? 0 : Math.round(precio * 100) / 100;
    }

    // Las tres son columnas NOT NULL con clave foránea: sin ellas el alta falla en la base
    if (has('id_empresa')) b.id_empresa = v.id(b.id_empresa, 'La empresa', { required: true });
    if (has('id_categoria')) b.id_categoria = v.id(b.id_categoria, 'La categoría', { required: true });
    if (has('id_unidad_medida')) b.id_unidad_medida = v.id(b.id_unidad_medida, 'La unidad de medida', { required: true });
    b.id_linea = v.id(b.id_linea, 'La línea');
    b.id_marca = v.id(b.id_marca, 'La marca');
});

// ---------- Proveedores ----------
exports.validateProveedor = (partial = false) => make((v, b) => {
    const has = (key) => !partial || b[key] !== undefined;

    if (has('cod')) b.cod = v.code(b.cod, 'El código', { required: true, max: 50 });
    if (has('nombre')) b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });
    if (has('nit')) b.nit = v.digits(b.nit, 'El NIT', { min: 5, max: 20 });
    if (has('direccion')) b.direccion = v.text(b.direccion, 'La dirección', { max: 500 });
    if (has('ciudad')) b.ciudad = v.text(b.ciudad, 'La ciudad', { max: 100 });
    if (has('zona')) b.zona = v.text(b.zona, 'La zona', { max: 100 });
    if (has('comentario')) b.comentario = v.text(b.comentario, 'El comentario', { max: 2000, multiline: true });
    if (b.id_tipodoc !== undefined) b.id_tipodoc = v.id(b.id_tipodoc, 'El tipo de documento');

    // Correos: se descartan las filas vacías y se valida el resto
    if (Array.isArray(b.emails)) {
        const filas = b.emails.filter((e) => e && typeof e === 'object' && String(e.email ?? '').trim() !== '');
        if (filas.length > 10) v.fail('Un proveedor no puede tener más de 10 correos');
        b.emails = filas.map((e, i) => ({
            email: v.email(e.email, `El correo #${i + 1}`, { required: true }),
            tipo: v.text(e.tipo, `El tipo del correo #${i + 1}`, { max: 20 }) || 'COMERCIAL'
        }));
    } else if (b.emails !== undefined && b.emails !== null) {
        v.fail('La lista de correos no es válida');
    }

    // Teléfonos: igual que los correos
    if (Array.isArray(b.telefonos)) {
        const filas = b.telefonos.filter((t) => t && typeof t === 'object' && String(t.telefono ?? '').trim() !== '');
        if (filas.length > 10) v.fail('Un proveedor no puede tener más de 10 teléfonos');
        b.telefonos = filas.map((t, i) => ({
            telefono: v.phone(t.telefono, `El teléfono #${i + 1}`, { required: true }),
            tipo: v.text(t.tipo, `El tipo del teléfono #${i + 1}`, { max: 20 }) || 'PRINCIPAL'
        }));
    } else if (b.telefonos !== undefined && b.telefonos !== null) {
        v.fail('La lista de teléfonos no es válida');
    }
});

// ---------- Almacenes ----------
exports.validateAlmacen = make((v, b) => {
    b.codigo = v.code(b.codigo, 'El código', { required: true, max: 50 });
    b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });
    b.direccion = v.text(b.direccion, 'La dirección', { max: 500 });
    b.telefono = v.phone(b.telefono, 'El teléfono');
    b.observacion = v.text(b.observacion, 'La observación', { max: 2000, multiline: true });
    b.zona = v.text(b.zona, 'La zona', { max: 100 });

    setIfPresent(b, 'estado', v.oneOf(b.estado, 'El estado', ESTADOS_ALMACEN));
    if (b.es_principal !== undefined) b.es_principal = v.bool(b.es_principal);
    if (b.es_tecnico !== undefined) b.es_tecnico = v.bool(b.es_tecnico);

    b.capacidad = v.int(b.capacidad, 'La capacidad', { min: 1, max: 1000000000 });
    b.id_tipo = v.id(b.id_tipo, 'El tipo de almacén', { required: true });
    b.id_cuenta_contable = v.id(b.id_cuenta_contable, 'La cuenta contable');
    b.id_centro_costo = v.id(b.id_centro_costo, 'El centro de costo');
    if (b.id_tecnico_optiweb !== undefined) b.id_tecnico_optiweb = v.id(b.id_tecnico_optiweb, 'El técnico');
    if (b.id_responsable !== undefined) b.id_responsable = v.id(b.id_responsable, 'El responsable');
});

// ---------- Unidades de medida ----------
exports.validateUnidadMedida = make((v, b) => {
    b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 50 });
    b.abreviatura = v.text(b.abreviatura, 'La abreviatura', {
        required: true,
        max: 10,
        pattern: /^[\p{L}\p{N} ./%²³°-]+$/u,
        patternMessage: 'solo puede contener letras, números, espacios y los signos . / % ² ³ ° -'
    });
    b.tipo = v.oneOf(b.tipo, 'El tipo', TIPOS_UNIDAD, { required: true });
    b.descripcion = v.text(b.descripcion, 'La descripción', { max: 1000, multiline: true });
});

// ---------- Clientes de internet ----------
const ZONAS_CLIENTE = ['SIPE_SIPE', 'SUTICOLLO', 'MALLCO_CHAPI'];
const PLANES_CLIENTE = ['ECONOMICO', 'MEDIO', 'PREMIUM', 'GAMER'];
const ESTADOS_CLIENTE = ['ACTIVO', 'INACTIVO'];

exports.validateCliente = make((v, b) => {
    b.numero_contrato = v.digits(b.numero_contrato, 'El número de contrato', { required: true, max: 30 });
    b.nombre_completo = v.name(b.nombre_completo, 'El nombre completo', { required: true, min: 3, max: 255 });
    b.ci = v.digits(b.ci, 'El CI', { required: true, min: 5, max: 10 });
    b.ci_complemento = v.text(b.ci_complemento, 'El complemento del CI', {
        max: 3,
        pattern: /^[A-Z0-9]{1,3}$/u,
        patternMessage: 'debe tener entre 1 y 3 letras o números'
    });
    b.celular = v.digits(b.celular, 'El celular', { required: true, min: 8, max: 8 });
    if (!v.error && b.celular && !/^[67]/.test(b.celular)) {
        v.fail('El celular debe empezar con 6 o 7');
    }
    b.zona = v.oneOf(b.zona, 'La zona', ZONAS_CLIENTE, { required: true });
    b.plan = v.oneOf(b.plan, 'El plan', PLANES_CLIENTE, { required: true });
});

// ---------- Estado (activar / desactivar) ----------
exports.validateEstadoCliente = make((v, b) => {
    b.estado = v.oneOf(b.estado, 'El estado', ESTADOS_CLIENTE, { required: true });
});

// ---------- Catálogos simples (categoría, marca, línea, empresa) ----------
exports.validateCatalogo = make((v, b) => {
    b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });
    b.descripcion = v.text(b.descripcion, 'La descripción', { max: 2000, multiline: true });
});

// ---------- Detalle de productos (ingresos, traspasos y salidas) ----------
// Todas las tablas de detalle tienen CHECK (cantidad > 0), así que nunca se admite cero.
function validateDetalles(v, b, { precio = false, precioOpcional = false, observaciones = false, sinRepetidos = false } = {}) {
    if (!Array.isArray(b.detalles) || b.detalles.length === 0) {
        v.fail('Debes agregar al menos un producto al detalle');
        return [];
    }
    if (b.detalles.length > MAX_DETALLES) {
        v.fail(`El detalle no puede tener más de ${MAX_DETALLES} productos`);
        return [];
    }

    const vistos = new Set();
    b.detalles = b.detalles.map((item, i) => {
        const n = i + 1;
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            v.fail(`El producto #${n} del detalle no es válido`);
            return item;
        }
        const out = { ...item };
        out.id_producto = v.id(item.id_producto, `El producto #${n}`, { required: true });
        out.cantidad = v.int(item.cantidad, `La cantidad del producto #${n}`, { required: true, min: 1, max: MAX_CANTIDAD });
        if (precio) {
            // `ingreso_detalle` exige precio_unitario > 0 (y con ella subtotal > 0)
            const precioNum = v.number(item.precio_unitario, `El precio del producto #${n}`, { required: true, min: 0.01, max: MAX_PRECIO });
            out.precio_unitario = precioNum === null ? null : Math.round(precioNum * 100) / 100;
        } else if (precioOpcional) {
            // En salidas y traspasos la línea puede no traer precio: se guarda 0 en lugar de reventar en la base
            const precioNum = item.precio_unitario === undefined || item.precio_unitario === null || item.precio_unitario === ''
                ? 0
                : v.number(item.precio_unitario, `El precio del producto #${n}`, { min: 0, max: MAX_PRECIO });
            out.precio_unitario = precioNum === null || precioNum === undefined ? 0 : Math.round(precioNum * 100) / 100;
        }
        if (observaciones) {
            out.observaciones = v.text(item.observaciones, `La observación del producto #${n}`, { max: 500, multiline: true });
        }
        // Un mismo producto repetido haría que el control de stock se evalúe línea por línea
        if (sinRepetidos && out.id_producto !== null) {
            if (vistos.has(out.id_producto)) v.fail(`El producto #${n} está repetido en el detalle; junta las cantidades en una sola línea`);
            vistos.add(out.id_producto);
        }
        return out;
    });
    return b.detalles;
}

// ---------- Ingresos (compras) ----------
exports.validateIngreso = make((v, b, req) => {
    b.id_proveedor = v.id(b.id_proveedor, 'El proveedor', { required: true });
    b.id_almacen = v.id(b.id_almacen, 'El almacén', { required: true });
    b.fecha = v.date(b.fecha, 'La fecha', { required: true });
    b.hora = v.time(b.hora, 'La hora', { required: true });
    b.doc_respaldo = v.text(b.doc_respaldo, 'El tipo de documento', { max: 100 }) ?? '';
    b.numero_doc = v.text(b.numero_doc, 'El número de documento', { max: 100 }) ?? '';
    b.detalle = v.text(b.detalle, 'El detalle', { max: 1000, multiline: true });
    // forma_pago es un ENUM: el valor vacío del selector debe guardarse como NULL
    b.forma_pago = v.oneOf(b.forma_pago, 'La forma de pago', FORMAS_PAGO);
    b.id_responsable = v.id(b.id_responsable, 'El responsable') ?? (req.user ? Number(req.user.id) : null);

    // `ingreso_detalle` tiene clave única (ingreso, producto): un producto repetido reventaría en la base
    validateDetalles(v, b, { precio: true, sinRepetidos: true });

    // El total declarado debe ser un número válido, pero el servidor guarda siempre el total real del detalle
    v.number(b.total, 'El total', { min: 0, max: MAX_PRECIO * 10 });
    if (!v.error) {
        const suma = b.detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
        b.total = Math.round(suma * 100) / 100;
    }
});

// ---------- Traspasos ----------
exports.validateTraspaso = make((v, b, req) => {
    b.id_almacen_origen = v.id(b.id_almacen_origen, 'El almacén de origen', { required: true });
    b.id_almacen_destino = v.id(b.id_almacen_destino, 'El almacén de destino', { required: true });
    if (b.id_almacen_origen !== null && b.id_almacen_origen === b.id_almacen_destino) {
        v.fail('El almacén de origen y el de destino no pueden ser el mismo');
    }
    b.fecha = v.date(b.fecha, 'La fecha', { required: true });
    b.hora = v.time(b.hora, 'La hora', { required: true });
    // `id_almacenero` es NOT NULL: sin él la base rechaza el alta, así que se toma el usuario de la sesión
    b.id_almacenero = v.id(b.id_almacenero, 'El almacenero') ?? (req.user ? Number(req.user.id) : null);
    if (!v.error && !b.id_almacenero) v.fail('El almacenero es requerido');
    b.glosa = v.text(b.glosa, 'La glosa', { max: 1000, multiline: true });
    b.observaciones = v.text(b.observaciones, 'Las observaciones', { max: 1000, multiline: true });
    validateDetalles(v, b, { observaciones: true, sinRepetidos: true });
});

// ---------- Salidas a producción ----------
exports.validateSalida = make((v, b, req) => {
    b.id_almacen = v.id(b.id_almacen, 'El almacén', { required: true });
    b.fecha = v.date(b.fecha, 'La fecha', { required: true });
    b.id_tipo_salida = v.id(b.id_tipo_salida, 'El tipo de salida', { required: true });
    b.id_responsable = v.id(b.id_responsable, 'El responsable') ?? (req.user ? Number(req.user.id) : null);
    b.id_orden_trabajo = v.id(b.id_orden_trabajo, 'La orden de trabajo');
    b.detalle = v.text(b.detalle, 'El detalle', { max: 1000, multiline: true });
    b.observaciones = v.text(b.observaciones, 'Las observaciones', { max: 1000, multiline: true });
    b.departamento = v.text(b.departamento, 'El departamento', { max: 100 });
    b.destino = v.text(b.destino, 'El destino', { max: 255 });

    // `lote`, `serie` y `estado_material` son columnas cortas con valores fijos: un valor inválido
    // abortaría el alta contra las restricciones CHECK de la base
    if (Array.isArray(b.detalles)) {
        b.detalles.forEach((item, i) => {
            if (item && typeof item === 'object') {
                item.lote = v.text(item.lote, `El lote del producto #${i + 1}`, { max: 50 });
                item.serie = v.text(item.serie, `El número de serie del producto #${i + 1}`, { max: 100 });
                item.estado_material = v.oneOf(item.estado_material, `El estado del material del producto #${i + 1}`, ESTADOS_MATERIAL) ?? 'NUEVO';
            }
        });
    }
    validateDetalles(v, b, { precioOpcional: true, sinRepetidos: true });
});
