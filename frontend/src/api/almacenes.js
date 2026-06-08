import { authenticatedFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

/**
 * Obtener todos los almacenes
 */
export const fetchAlmacenes = async () => {
    try {
        return await authenticatedFetch(`${API_URL}/api/almacenes`);
    } catch (error) {
        console.error('Error al obtener almacenes:', error);
        throw error;
    }
};

/**
 * Crear un nuevo almacén
 */
export const crearAlmacen = async (almacen) => {
    try {
        return await authenticatedFetch(`${API_URL}/api/almacenes`, {
            method: 'POST',
            body: JSON.stringify(almacen)
        });
    } catch (error) {
        console.error('Error al crear almacén:', error);
        throw error;
    }
};

/**
 * Actualizar un almacén existente
 */
export const editarAlmacen = async (id, almacen) => {
    try {
        return await authenticatedFetch(`${API_URL}/api/almacenes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(almacen)
        });
    } catch (error) {
        console.error('Error al actualizar almacén:', error);
        throw error;
    }
};

/**
 * Eliminar un almacén
 */
export const eliminarAlmacen = async (id) => {
    try {
        return await authenticatedFetch(`${API_URL}/api/almacenes/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error al eliminar almacén:', error);
        throw error;
    }
};

/**
 * Obtener opciones para formularios de almacén (tipos, cuentas, responsables, etc.)
 */
export const fetchOpcionesAlmacen = async () => {
    try {
        const response = await fetch(`${API_URL}/api/almacenes/opciones`);
        if (!response.ok) {
            throw new Error('Error al obtener opciones de almacén');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener opciones de almacén:', error);
        throw error;
    }
};