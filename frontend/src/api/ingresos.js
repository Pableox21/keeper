import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchIngresos() {
    return authenticatedFetch(`${API_URL}/api/ingresos`);
}

export async function fetchIngresoById(id) {
    return authenticatedFetch(`${API_URL}/api/ingresos/${id}`);
}

export async function crearIngreso(ingreso) {
    return authenticatedFetch(`${API_URL}/api/ingresos`, {
        method: 'POST',
        body: JSON.stringify(ingreso)
    });
}

export async function eliminarIngreso(id) {
    return authenticatedFetch(`${API_URL}/api/ingresos/${id}`, {
        method: 'DELETE'
    });
}

export async function actualizarIngreso(id, ingreso) {
    return authenticatedFetch(`${API_URL}/api/ingresos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ingreso)
    });
}
