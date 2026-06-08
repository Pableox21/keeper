import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchCategorias() {
    return authenticatedFetch(`${API_URL}/api/categorias`);
}

export async function crearCategoria(nombre) {
    const res = await fetch(`${API_URL}/api/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear categoría');
    }
    return res.json();
}

export async function editarCategoria(id, nombre) {
    const res = await fetch(`${API_URL}/api/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al editar categoría');
    }
    return res.json();
}

export async function eliminarCategoria(id) {
    const res = await fetch(`${API_URL}/api/categorias/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar categoría');
    }
    return res.json();
}
