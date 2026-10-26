const { Validator } = require('../utils/validator');

// Estos middlewares validan y NORMALIZAN req.body antes de llegar al controlador:
// si algo es inválido responden 400 con un mensaje claro; si todo está bien, el controlador
// recibe los datos ya limpios (sin espacios sobrantes, números como número, etc.).

const ESTADOS_PRODUCTO = ['ACTIVO', 'INACTIVO', 'DESCONTINUADO'];
const ESTADOS_ALMACEN = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];
const TIPOS_UNIDAD = ['PESO', 'VOLUMEN', 'LONGITUD', 'AREA', 'UNIDAD', 'TIEMPO'];
const FORMAS_PAGO = ['EFECTIVO', 'QR', 'TRANSFERENCIA'];

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
exports.validateProducto = (isUpdate = false) => make((v, b) => {
    b.codigo = v.code(b.codigo, 'El código', { required: true, max: 50 });
    b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });
    b.unidad_ingreso = v.text(b.unidad_ingreso, 'La unidad de ingreso', { max: 50 }) || 'Unidad';

    const stockMin = v.int(b.stock_minimo, 'El stock mínimo', { min: 0, max: 1000000000 });
    const stockMax = v.int(b.stock_maximo, 'El stock máximo', { min: 0, max: 1000000000 });
    b.stock_minimo = stockMin ?? 0;
    b.stock_maximo = stockMax;
    if (stockMax !== null && stockMax < b.stock_minimo) {
        v.fail('El stock máximo no puede ser menor al stock mínimo');
    }

    b.estado = v.oneOf(b.estado, 'El estado', ESTADOS_PRODUCTO) || 'ACTIVO';

    setIfPresent(b, 'id_empresa', v.id(b.id_empresa, 'La empresa', { required: isUpdate }));
    setIfPresent(b, 'id_categoria', v.id(b.id_categoria, 'La categoría', { required: isUpdate }));
    // Al crear, si no viene, el controlador usa la unidad por defecto (importaciones desde Excel)
    setIfPresent(b, 'id_unidad_medida', v.id(b.id_unidad_medida, 'La unidad de medida', { required: isUpdate }));
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

// ---------- Catálogos simples (categoría, marca, línea, empresa) ----------
exports.validateCatalogo = make((v, b) => {
    b.nombre = v.text(b.nombre, 'El nombre', { required: true, max: 255 });
    b.descripcion = v.text(b.descripcion, 'La descripción', { max: 2000, multiline: true });
});

// ---------- Detalle de productos (ingresos, traspasos y salidas) ----------
function validateDetalles(v, b, { precio = false, observaciones = false, sinRepetidos = false, permitirCero = false } = {}) {
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
        out.cantidad = v.int(item.cantidad, `La cantidad del producto #${n}`, { required: true, min: permitirCero ? 0 : 1, max: MAX_CANTIDAD });
        if (precio) {
            // El precio se guarda con 2 decimales: se redondea igual que lo haría la base de datos
            const precioNum = v.number(item.precio_unitario, `El precio del producto #${n}`, { required: true, min: 0, max: MAX_PRECIO });
            out.precio_unitario = precioNum === null ? null : Math.round(precioNum * 100) / 100;
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

    // Inventario Inicial puede traer productos con cantidad 0, siempre que haya al menos uno con stock
    const detalles = validateDetalles(v, b, { precio: true, permitirCero: true });
    if (!v.error && !detalles.some((d) => d.cantidad > 0)) {
        v.fail('Debes registrar al menos un producto con cantidad mayor a 0');
    }

    // El total declarado debe ser un número válido, pero el servidor guarda siempre el total real del detalle
    v.number(b.total, 'El total', { min: 0, max: MAX_PRECIO * 10 });
    if (!v.error) {
        const suma = detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
        b.total = Math.round(suma * 100) / 100;
    }
});

// ---------- Traspasos ----------
exports.validateTraspaso = make((v, b) => {
    b.id_almacen_origen = v.id(b.id_almacen_origen, 'El almacén de origen', { required: true });
    b.id_almacen_destino = v.id(b.id_almacen_destino, 'El almacén de destino', { required: true });
    if (b.id_almacen_origen !== null && b.id_almacen_origen === b.id_almacen_destino) {
        v.fail('El almacén de origen y el de destino no pueden ser el mismo');
    }
    b.fecha = v.date(b.fecha, 'La fecha', { required: true });
    b.hora = v.time(b.hora, 'La hora', { required: true });
    setIfPresent(b, 'id_almacenero', v.id(b.id_almacenero, 'El almacenero'));
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
    b.detalle = v.text(b.detalle, 'El detalle', { max: 1000, multiline: true });
    b.observaciones = v.text(b.observaciones, 'Las observaciones', { max: 1000, multiline: true });
    b.departamento = v.text(b.departamento, 'El departamento', { max: 100 });
    b.destino = v.text(b.destino, 'El destino', { max: 255 });
    validateDetalles(v, b, { sinRepetidos: true });
});
