import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

// Obtener opciones para formulario de salida
export const fetchOpcionesSalida = async () => {
    return authenticatedFetch(`${API_URL}/api/salidas/opciones`);
};

// Obtener todas las salidas
export const fetchSalidas = async () => {
    return authenticatedFetch(`${API_URL}/api/salidas`);
};

// Registrar una nueva salida
export const registrarSalida = async (salida) => {
    return authenticatedFetch(`${API_URL}/api/salidas`, {
        method: 'POST',
        body: JSON.stringify(salida)
    });
};

// Actualizar una salida existente
export const actualizarSalida = async (id, salida) => {
    return authenticatedFetch(`${API_URL}/api/salidas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(salida)
    });
};

// Eliminar una salida
export const eliminarSalida = async (id) => {
    return authenticatedFetch(`${API_URL}/api/salidas/${id}`, {
        method: 'DELETE'
    });
};
