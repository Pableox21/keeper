import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchLineas() {
    return authenticatedFetch(`${API_URL}/api/lineas`);
}

export async function crearLinea(nombre) {
    return authenticatedFetch(`${API_URL}/api/lineas`, {
        method: 'POST',
        body: JSON.stringify({ nombre })
    });
}

export async function editarLinea(id, nombre) {
    return authenticatedFetch(`${API_URL}/api/lineas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre })
    });
}

export async function eliminarLinea(id) {
    return authenticatedFetch(`${API_URL}/api/lineas/${id}`, {
        method: 'DELETE'
    });
}
