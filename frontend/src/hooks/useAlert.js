import { useState, useCallback } from 'react';
/**
 * Hook para gestión centralizada de alertas.
 * @param {object} initialAlert Estado inicial opcional
 * @returns {object} { alert, showAlert, closeAlert, setAlert }
 */
export function useAlert(initialAlert = { open: false, type: 'info', message: '' }) {
    const [alert, setAlert] = useState(initialAlert);
    // Mostrar alerta
    const showAlert = useCallback((type, message, duration = 3000) => {
        setAlert({ open: true, type, message });
        if (duration > 0) {
            setTimeout(() => setAlert(a => ({ ...a, open: false })), duration);
        }
    }, []);
    // Cerrar alerta
    const closeAlert = useCallback(() => {
        setAlert(a => ({ ...a, open: false }));
    }, []);
    return {
        alert,
        setAlert,
        showAlert,
        closeAlert,
    };
}
