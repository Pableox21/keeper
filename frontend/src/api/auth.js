// API para manejo de autenticación
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

export const authAPI = {
    // Login de usuario
    login: async (credentials) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en el login');
        }

        return response.json();
    },

    // Logout de usuario
    logout: async (token) => {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en el logout');
        }

        return response.json();
    },

    // Registro de usuario (solo admins)
    register: async (userData, token) => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en el registro');
        }

        return response.json();
    }
};

// Función helper para hacer peticiones autenticadas
export const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Si el token expiró, redirigir al login
    if (response.status === 401 || response.status === 440) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = '/login';
        throw new Error('Sesión expirada');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la petición');
    }

    return response.json();
};