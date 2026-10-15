import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchClientes() {
    return authenticatedFetch(`${API_URL}/api/clientes`);
}

export async function crearCliente(cliente) {
    return authenticatedFetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        body: JSON.stringify(cliente)
    });
}

export async function editarCliente(id, cliente) {
    return authenticatedFetch(`${API_URL}/api/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cliente)
    });
}

export async function cambiarEstadoCliente(id, estado) {
    return authenticatedFetch(`${API_URL}/api/clientes/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
    });
}

export async function eliminarCliente(id) {
    return authenticatedFetch(`${API_URL}/api/clientes/${id}`, {
        method: 'DELETE'
    });
}
