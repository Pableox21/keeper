const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export async function fetchMarcas() {
  const res = await fetch(`${API_URL}/api/marcas`);
  if (!res.ok) throw new Error('Error al obtener marcas');
  return res.json();
}

export async function crearMarca(nombre) {
  const res = await fetch(`${API_URL}/api/marcas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al crear marca');
  }
  return res.json();
}

export async function editarMarca(id, nombre) {
  const res = await fetch(`${API_URL}/api/marcas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al editar marca');
  }
  return res.json();
}

export async function eliminarMarca(id) {
  const res = await fetch(`${API_URL}/api/marcas/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al eliminar marca');
  }
  return res.json();
}