import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchUnidadesMedida() {
    return authenticatedFetch(`${API_URL}/api/unidades-medida`);
}

export async function crearUnidadMedida(unidad) {
    return authenticatedFetch(`${API_URL}/api/unidades-medida`, {
        method: 'POST',
        body: JSON.stringify(unidad)
    });
}

export async function editarUnidadMedida(id, unidad) {
    return authenticatedFetch(`${API_URL}/api/unidades-medida/${id}`, {
        method: 'PUT',
        body: JSON.stringify(unidad)
    });
}

export async function eliminarUnidadMedida(id) {
    return authenticatedFetch(`${API_URL}/api/unidades-medida/${id}`, {
        method: 'DELETE'
    });
}