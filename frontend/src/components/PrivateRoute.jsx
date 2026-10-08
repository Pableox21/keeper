import React from 'react';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, hasRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    {/* Spinner animado */}
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    
                    {/* Logo o título */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Keeper</h2>
                    
                    {/* Texto de carga */}
                    <p className="text-gray-600 animate-pulse">Cargando sistema...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        // Redirigir al login
        window.location.href = '/login';
        return null;
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    {/* Icono de acceso denegado */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
                    <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página.</p>
                    
                    <button 
                        onClick={() => window.history.back()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Regresar
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;