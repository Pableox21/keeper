// Restricciones de escritura y validaciones de campos, iguales a las del backend
// (backend/src/utils/validator.js). Se usan en los onChange para que el usuario no pueda
// escribir caracteres que luego el servidor rechazaría.

const toText = (value) => String(value ?? '');

// Solo dígitos (CI, celular, NIT, stocks...)
export const onlyDigits = (value, max = 20) => toText(value).replace(/\D/g, '').slice(0, max);

// Teléfonos: dígitos y los separadores habituales (+ espacio - paréntesis)
export const phoneChars = (value, max = 20) => toText(value).replace(/[^\d\s+()-]/g, '').slice(0, max);

// Nombres de persona: letras (con tildes y ñ), espacios y . ' -
export const nameChars = (value, max = 255) => toText(value).replace(/[^\p{L}\s.'’-]/gu, '').slice(0, max);

// Nombre de usuario (login): letras, números y . _ -
export const usernameChars = (value, max = 50) => toText(value).replace(/[^A-Za-z0-9._-]/g, '').slice(0, max);

// Códigos: letras, números, espacios y . , _ - / # ( ) + : %
export const codeChars = (value, max = 50) => toText(value).replace(/[^\p{L}\p{N}._\-/ #()+:,%]/gu, '').slice(0, max);

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_REGEX = /^\p{L}[\p{L}\s.'’-]*$/u;
export const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
