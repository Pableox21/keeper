/**
 * Badge Atom - Indicador/badge reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Contenido del badge
 * @param {string} props.variant - Variante del badge (primary, secondary, success, warning, danger)
 * @param {string} props.size - Tamaño del badge (sm, md, lg)
 * @param {boolean} props.dot - Solo mostrar un punto sin contenido
 * @param {string} props.className - Clases adicionales
 */
function Badge({ children, variant = 'primary', size = 'sm', dot = false, className = '' }) {
    const baseClasses = 'rounded-full font-medium flex items-center justify-center'
    
    const variants = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-500 text-white',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        danger: 'bg-red-500 text-white'
    }
    
    const sizes = {
        sm: dot ? 'w-2 h-2' : 'w-5 h-5 text-xs min-w-5',
        md: dot ? 'w-3 h-3' : 'w-6 h-6 text-sm min-w-6',
        lg: dot ? 'w-4 h-4' : 'w-8 h-8 text-base min-w-8'
    }
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
    
    return (
        <span className={classes}>
            {!dot && children}
        </span>
    )
}

export default Badge