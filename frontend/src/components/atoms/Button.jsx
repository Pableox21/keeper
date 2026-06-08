/**
 * Button Atom - Componente de botón reutilizable con estilo único
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Contenido del botón (ícono + texto)
 * @param {Function} props.onClick - Función de click
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.className - Clases adicionales
 */
function Button({ 
    children, 
    onClick, 
    disabled = false, 
    className = '',
    ...props 
}) {
    const baseClasses = 'flex items-center gap-2 px-4 py-1 text-xs font-medium text-white bg-slate-600 border border-slate-700 transition-all duration-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'
    
    const disabledClasses = disabled 
        ? 'opacity-50 cursor-not-allowed hover:bg-slate-600' 
        : 'cursor-pointer'
    
    const classes = `${baseClasses} ${disabledClasses} ${className}`
    
    return (
        <button
            className={classes}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button