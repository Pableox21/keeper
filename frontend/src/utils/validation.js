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
 * Validación de campos obligatorios del alta/edición de productos
 */
export function validateProductForm(values) {
  // Empresa y categoría son obligatorias: la columna no admite nulo y sin ellas el alta falla
  const required = {
    codigo: 'Código',
    nombre: 'Nombre',
    empresa: 'Empresa',
    categoria: 'Categoría'
  };
  const missing = Object.entries(required)
    .filter(([field]) => !values[field] || values[field].toString().trim() === '')
    .map(([, label]) => label);
  if (missing.length > 0) {
    return `Por favor, completa los campos obligatorios: ${missing.join(', ')}`;
  }
  return null;
}
