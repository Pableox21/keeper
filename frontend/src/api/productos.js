import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchProductos() {
    return authenticatedFetch(`${API_URL}/api/productos`);
}

export async function crearProducto(producto) {
    return authenticatedFetch(`${API_URL}/api/productos`, {
        method: 'POST',
        body: JSON.stringify(producto)
    });
}

export async function editarProducto(id, producto) {
    return authenticatedFetch(`${API_URL}/api/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(producto)
    });
}

export async function eliminarProducto(id) {
    return authenticatedFetch(`${API_URL}/api/productos/${id}`, {
        method: 'DELETE'
    });
}
