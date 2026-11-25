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

// Las importaciones desde Excel traen el nombre de la unidad, pero el producto se guarda por id.
// `unidades` es la lista ya leída; se le agregan las que se creen durante la misma importación.
export async function buscarOCrearUnidadMedida(nombre, unidades) {
    const nombreBuscado = (nombre || '').trim() || 'Unidad';
    let unidad = unidades.find(u => (u.nombre || '').trim().toLowerCase() === nombreBuscado.toLowerCase());
    if (!unidad) {
        unidad = await crearUnidadMedida({ nombre: nombreBuscado, abreviatura: nombreBuscado, tipo: 'UNIDAD', descripcion: '' });
        unidades.push(unidad);
    }
    return unidad.id;
}