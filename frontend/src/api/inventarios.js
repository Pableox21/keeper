import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

// ===== Inventario por Almacén =====
export async function fetchInventarioPorAlmacen(idAlmacen) {
  return authenticatedFetch(`${API_URL}/api/inventario/almacen/${idAlmacen}`);
}

// ===== Almacenes =====
export async function fetchAlmacenes() {
  return authenticatedFetch(`${API_URL}/api/almacenes`);
}