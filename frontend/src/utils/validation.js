// utils/validation.js

/**
 * Valida los campos obligatorios de un objeto de formulario.
 * @param {Object} values - Los valores del formulario.
 * @param {Array<string>} requiredFields - Lista de campos obligatorios.
 * @returns {string|null} - Mensaje de error o null si todo es válido.
 */
export function validateRequiredFields(values, requiredFields) {
  for (const field of requiredFields) {
    if (!values[field] || values[field].toString().trim() === '') {
      return `Por favor, completa el campo obligatorio: ${field}`;
    }
  }
  return null;
}

/**
 * Ejemplo de validación personalizada para productos
 */
export function validateProductForm(values) {
  const required = ['codigo', 'nombre'];
  const missing = required.filter(f => !values[f] || values[f].toString().trim() === '');
  if (missing.length > 0) {
    return `Por favor, completa los campos obligatorios: ${missing.join(', ')}`;
  }
  // Puedes agregar más validaciones aquí
  return null;
}
