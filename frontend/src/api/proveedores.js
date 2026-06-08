import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchProveedores() {
    return authenticatedFetch(`${API_URL}/api/proveedores`);
}

export async function crearProveedor(proveedor) {
    return authenticatedFetch(`${API_URL}/api/proveedores`, {
        method: 'POST',
        body: JSON.stringify(proveedor)
    });
}

export async function crearProveedorTelefono(proveedorId, telefono) {
    return authenticatedFetch(`${API_URL}/api/proveedores/${proveedorId}/telefonos`, {
        method: 'POST',
        body: JSON.stringify(telefono)
    });
}

export async function crearProveedorEmail(proveedorId, email) {
    return authenticatedFetch(`${API_URL}/api/proveedores/${proveedorId}/emails`, {
        method: 'POST',
        body: JSON.stringify(email)
    });
}

export async function editarProveedor(id, proveedor) {
    return authenticatedFetch(`${API_URL}/api/proveedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(proveedor)
    });
}

export async function eliminarProveedor(proveedorId) {
    return authenticatedFetch(`${API_URL}/api/proveedores/${proveedorId}`, {
        method: 'DELETE'
    });
}