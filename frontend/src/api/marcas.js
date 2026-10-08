import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchMarcas() {
    return authenticatedFetch(`${API_URL}/api/marcas`);
}

export async function crearMarca(nombre) {
    return authenticatedFetch(`${API_URL}/api/marcas`, {
        method: 'POST',
        body: JSON.stringify({ nombre })
    });
}

export async function editarMarca(id, nombre) {
    return authenticatedFetch(`${API_URL}/api/marcas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre })
    });
}

export async function eliminarMarca(id) {
    return authenticatedFetch(`${API_URL}/api/marcas/${id}`, {
        method: 'DELETE'
    });
}
