// Validaciones y normalización de campos, reutilizables en todos los módulos.
// Uso:
//   const v = new Validator();
//   const nombre = v.text(body.nombre, 'El nombre', { required: true, max: 255 });
//   if (v.error) return res.status(400).json({ error: v.error });
// Solo se guarda el PRIMER error encontrado, que es el que se muestra al usuario.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Personas: solo letras (con tildes y ñ), espacios y los signos . ' -
const NAME_REGEX = /^\p{L}[\p{L}\s.'’-]*$/u;
// Códigos: letras, números, espacios y los signos . , _ - / # ( ) + : %
const CODE_REGEX = /^[\p{L}\p{N}][\p{L}\p{N}._\-/ #()+:,%]*$/u;
// Nombre de usuario (login): letras, números y . _ -   (sin espacios)
const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

class Validator {
    constructor() {
        this.error = null;
    }

    fail(message) {
        if (!this.error) this.error = message;
    }

    // Concuerda el género del mensaje con la etiqueta: "La fecha es requerida" / "El nombre es requerido"
    _fem(label) {
        return /^(la|las)\s/i.test(label);
    }

    _req(label) {
        return `${label} es ${this._fem(label) ? 'requerida' : 'requerido'}`;
    }

    _invalid(label) {
        return `${label} no es ${this._fem(label) ? 'válida' : 'válido'}`;
    }

    _isEmpty(value) {
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    }

    // Texto libre. Devuelve el texto limpio o null si viene vacío.
    text(value, label, { required = false, min = 0, max = 255, pattern = null, patternMessage = null, multiline = false } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        if (typeof value !== 'string' && typeof value !== 'number') {
            this.fail(this._invalid(label));
            return null;
        }
        let text = String(value).trim();
        text = multiline ? text.replace(/[ \t]+/g, ' ') : text.replace(/\s+/g, ' ');

        if (CONTROL_CHARS.test(text)) {
            this.fail(`${label} contiene caracteres no permitidos`);
            return null;
        }
        if (text.length < min) this.fail(`${label} debe tener al menos ${min} caracteres`);
        if (text.length > max) this.fail(`${label} no puede superar los ${max} caracteres`);
        if (pattern && !pattern.test(text)) this.fail(`${label} ${patternMessage || 'tiene un formato inválido'}`);
        return text;
    }

    // Nombre de persona: sin números ni símbolos.
    name(value, label, { required = false, min = 3, max = 255 } = {}) {
        return this.text(value, label, {
            required, min, max,
            pattern: NAME_REGEX,
            patternMessage: 'solo puede contener letras y espacios (sin números ni símbolos)'
        });
    }

    // Código (de producto, proveedor, almacén...).
    code(value, label, { required = false, max = 50 } = {}) {
        return this.text(value, label, {
            required, max,
            pattern: CODE_REGEX,
            patternMessage: 'solo puede contener letras, números, espacios y los signos . , _ - / # ( ) + : %'
        });
    }

    email(value, label, { required = false, max = 255 } = {}) {
        const text = this.text(value, label, { required, max });
        if (text === null) return null;
        const email = text.toLowerCase();
        if (!EMAIL_REGEX.test(email)) {
            this.fail(`${label} no es un email válido`);
            return null;
        }
        return email;
    }

    // Solo dígitos, con largo mínimo y máximo.
    digits(value, label, { required = false, min = 1, max = 20 } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const text = String(value).trim();
        if (!/^\d+$/.test(text)) {
            this.fail(`${label} solo puede contener números`);
            return null;
        }
        if (text.length < min || text.length > max) {
            this.fail(min === max ? `${label} debe tener ${min} dígitos` : `${label} debe tener entre ${min} y ${max} dígitos`);
            return null;
        }
        return text;
    }

    // Teléfono boliviano: 7 u 8 dígitos (acepta espacios, guiones, paréntesis y prefijo +591).
    phone(value, label, { required = false } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        let text = String(value).trim().replace(/[\s\-()]/g, '');
        if (text.startsWith('+591')) text = text.slice(4);
        else if (/^591\d{8}$/.test(text)) text = text.slice(3);

        if (!/^\d{7,8}$/.test(text)) {
            this.fail(`${label} debe tener 7 u 8 dígitos (solo números)`);
            return null;
        }
        return text;
    }

    // Número entero.
    int(value, label, { required = false, min = null, max = null } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const n = typeof value === 'number' ? value : Number(String(value).trim());
        if (!Number.isInteger(n)) {
            this.fail(`${label} debe ser un número entero`);
            return null;
        }
        if (min !== null && n < min) this.fail(`${label} debe ser ${min === 0 ? 'mayor o igual a 0' : `al menos ${min}`}`);
        if (max !== null && n > max) this.fail(`${label} no puede ser mayor a ${max}`);
        return n;
    }

    // Identificador (entero positivo).
    id(value, label, { required = false } = {}) {
        return this.int(value, label, { required, min: 1 });
    }

    // Número decimal, con tope opcional de decimales.
    number(value, label, { required = false, min = null, max = null, decimals = null } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const n = typeof value === 'number' ? value : Number(String(value).trim());
        if (!Number.isFinite(n)) {
            this.fail(`${label} debe ser un número`);
            return null;
        }
        if (min !== null && n < min) this.fail(`${label} debe ser ${min === 0 ? 'mayor o igual a 0' : `al menos ${min}`}`);
        if (max !== null && n > max) this.fail(`${label} no puede ser mayor a ${max}`);
        if (decimals !== null) {
            const factor = 10 ** decimals;
            if (Math.abs(n * factor - Math.round(n * factor)) > 1e-6) {
                this.fail(`${label} no puede tener más de ${decimals} decimales`);
            }
        }
        return n;
    }

    // Valor dentro de una lista (se compara en mayúsculas).
    oneOf(value, label, list, { required = false } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const text = String(value).trim().toUpperCase();
        if (!list.includes(text)) {
            this.fail(this._invalid(label));
            return null;
        }
        return text;
    }

    // Fecha YYYY-MM-DD (acepta ISO con hora y se queda con la fecha). No admite fechas muy futuras.
    date(value, label, { required = false, maxDaysAhead = 1, minYear = 2000 } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
        if (!match) {
            this.fail(`${label} no es válida (formato AAAA-MM-DD)`);
            return null;
        }
        const [, y, m, d] = match.map(Number);
        const parsed = new Date(Date.UTC(y, m - 1, d));
        const isReal = parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
        if (!isReal || y < minYear) {
            this.fail(this._invalid(label));
            return null;
        }
        const limit = Date.now() + (maxDaysAhead + 1) * 24 * 60 * 60 * 1000;
        if (parsed.getTime() > limit) {
            this.fail(`${label} no puede ser una fecha futura`);
            return null;
        }
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    time(value, label, { required = false } = {}) {
        if (this._isEmpty(value)) {
            if (required) this.fail(this._req(label));
            return null;
        }
        const text = String(value).trim();
        if (!TIME_REGEX.test(text)) {
            this.fail(`${label} no es válida (formato HH:MM)`);
            return null;
        }
        return text;
    }

    // true/false/1/0/'1'/'true' -> 1 o 0
    bool(value) {
        return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
    }
}

module.exports = { Validator, EMAIL_REGEX, NAME_REGEX, CODE_REGEX, USERNAME_REGEX };
