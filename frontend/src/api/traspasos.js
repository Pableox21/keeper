import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

// Función para obtener todas las opciones del formulario de traspasos
export async function fetchOpcionesTraspaso() {
    const data = await authenticatedFetch(`${API_URL}/api/traspasos/opciones`);
    console.log('Respuesta /api/traspasos/opciones:', data);
    return data;
}

// Función para obtener todos los traspasos
export async function fetchTraspasos() {
    return authenticatedFetch(`${API_URL}/api/traspasos`);
}

// Función para obtener un traspaso por ID
export async function fetchTraspasoById(id) {
    return authenticatedFetch(`${API_URL}/api/traspasos/${id}`);
}

// Función para crear un nuevo traspaso
export async function crearTraspaso(traspasoData) {
    return authenticatedFetch(`${API_URL}/api/traspasos`, {
        method: 'POST',
        body: JSON.stringify(traspasoData)
    });
}

// Función para actualizar un traspaso
export async function editarTraspaso(id, traspasoData) {
    return authenticatedFetch(`${API_URL}/api/traspasos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(traspasoData)
    });
}

// Función para eliminar un traspaso
export async function eliminarTraspaso(id) {
    return authenticatedFetch(`${API_URL}/api/traspasos/${id}`, {
        method: 'DELETE'
    });
}

// Función para cambiar el estado de un traspaso
export async function cambiarEstadoTraspaso(id, estado) {
    return authenticatedFetch(`${API_URL}/api/traspasos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
    });
}