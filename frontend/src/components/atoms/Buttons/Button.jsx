/**
 * Button Atom - Componente de botón reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Contenido del botón
 * @param {string} props.variant - Variante del botón (primary, secondary, ghost, danger)
 * @param {Function} props.onClick - Función de click
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.className - Clases adicionales
 */
function Button({ 
    children, 
    variant = 'primary', 
    onClick, 
    disabled = false, 
    className = '',
    ...props 
}) {
    const baseClasses = 'font-medium transition-all duration-200 focus:outline-none rounded text-sm'
    
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
    }
    
    const disabledClasses = disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'cursor-pointer active:scale-95'
    
    const classes = `${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`
    
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