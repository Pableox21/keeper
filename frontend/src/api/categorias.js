import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchCategorias() {
    return authenticatedFetch(`${API_URL}/api/categorias`);
}

export async function crearCategoria(nombre) {
    return authenticatedFetch(`${API_URL}/api/categorias`, {
        method: 'POST',
        body: JSON.stringify({ nombre })
    });
}

export async function editarCategoria(id, nombre) {
    return authenticatedFetch(`${API_URL}/api/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre })
    });
}

export async function eliminarCategoria(id) {
    return authenticatedFetch(`${API_URL}/api/categorias/${id}`, {
        method: 'DELETE'
    });
}
