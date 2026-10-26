import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchUsuarios() {
    return authenticatedFetch(`${API_URL}/api/auth/users`);
}

export async function crearUsuario(usuario) {
    return authenticatedFetch(`${API_URL}/api/auth/users`, {
        method: 'POST',
        body: JSON.stringify(usuario)
    });
}

export async function editarUsuario(id, usuario) {
    return authenticatedFetch(`${API_URL}/api/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(usuario)
    });
}

export async function cambiarEstadoUsuario(id, estado) {
    return authenticatedFetch(`${API_URL}/api/auth/users/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
    });
}

export async function fetchMiPerfil() {
    return authenticatedFetch(`${API_URL}/api/auth/me`);
}

export async function eliminarUsuario(id) {
    return authenticatedFetch(`${API_URL}/api/auth/users/${id}`, {
        method: 'DELETE'
    });
}
