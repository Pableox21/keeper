import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function editarEmpresa(id, nombre) {
    return authenticatedFetch(`${API_URL}/api/empresas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre })
    });
}

export async function eliminarEmpresa(id) {
    return authenticatedFetch(`${API_URL}/api/empresas/${id}`, {
        method: 'DELETE'
    });
}

export async function fetchEmpresas() {
    return authenticatedFetch(`${API_URL}/api/empresas`);
}

export async function crearEmpresa(nombre) {
    return authenticatedFetch(`${API_URL}/api/empresas`, {
        method: 'POST',
        body: JSON.stringify({ nombre })
    });
}
