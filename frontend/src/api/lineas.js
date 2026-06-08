const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchLineas() {
    const res = await fetch(`${API_URL}/api/lineas`);
    if (!res.ok) throw new Error('Error al obtener líneas');
    return res.json();
}

export async function crearLinea(nombre) {
    const res = await fetch(`${API_URL}/api/lineas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear línea');
    }
    return res.json();
}

export async function editarLinea(id, nombre) {
    const res = await fetch(`${API_URL}/api/lineas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al editar línea');
    }
    return res.json();
}

export async function eliminarLinea(id) {
    const res = await fetch(`${API_URL}/api/lineas/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar línea');
    }
    return res.json();
}