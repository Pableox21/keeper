import React from 'react'

/**
 * Alert - Componente reutilizable tipo daisyUI
 * @param {string} type - success | error | info | warning
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} open - Si el alert está visible
 * @param {function} onClose - Función para cerrar el alert
 * @param {number} duration - Tiempo en ms para autocerrar (opcional)
 */
function Alert({ type = 'info', message, open, onClose, duration = 1000 }) {
    React.useEffect(() => {
        if (open && duration) {
            const timer = setTimeout(onClose, duration)
            return () => clearTimeout(timer)
        }
    }, [open, duration, onClose])

    if (!open) return null

        const typeMap = {
            success: 'border-green-400 text-green-700',
            error: 'border-red-400 text-red-700',
            info: 'border-blue-400 text-blue-700',
            warning: 'border-yellow-400 text-yellow-700',
        }

        return (
            <div className={`alert bg-white border ${typeMap[type] || typeMap.info} shadow-lg fixed top-1/2 left-1/2 z-50 w-98 max-w-full transform -translate-x-1/2 -translate-y-1/2 text-lg animate-fade-in`}>
                <span className="fle-1">{message}</span>
                <button className="btn btn-sm btn-ghost ml-2" onClick={onClose}>
                    
                </button>
            </div>
        )
}

export default Alert
