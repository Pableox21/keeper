import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar datos del localStorage al iniciar
    useEffect(() => {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('authUser');
        
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            // No se activa el loading global: desmontaría el formulario y se perdería el mensaje de error
            const response = await authAPI.login(credentials);
            
            const { token: newToken, user: userData } = response;
            
            // Guardar en localStorage
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            
            // Actualizar estado
            setToken(newToken);
            setUser(userData);
            
            return { success: true };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await authAPI.logout(token);
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar datos locales independientemente del resultado
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
        }
    };

    // Crear usuario desde el panel (requiere sesión ADMIN)
    const createUser = async (userData) => {
        try {
            if (!token) {
                throw new Error('No autorizado para crear usuarios');
            }

            const response = await authAPI.createUser(userData, token);
            return { success: true, data: response };
        } catch (error) {
            console.error('Error al crear usuario:', error);
            return { success: false, error: error.message };
        }
    };

    const isAuthenticated = () => {
        return !!(token && user);
    };

    const hasRole = (role) => {
        return user && user.rol === role;
    };

    const isAdmin = () => {
        return hasRole('ADMIN');
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        createUser,
        isAuthenticated,
        hasRole,
        isAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};