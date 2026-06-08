/**
 * Input Atom - Componente de input reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de input (text, email, password, number, etc.)
 * @param {string} props.placeholder - Texto placeholder
 * @param {string} props.value - Valor del input
 * @param {Function} props.onChange - Función de cambio
 * @param {string} props.variant - Variante del input (default, error, success)
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.className - Clases adicionales
 * @param {string} props.id - ID del input
 * @param {string} props.name - Nombre del input
 */
function Input({
    type = 'text',
    placeholder = '',
    value,
    onChange,
    variant = 'default',
    disabled = false,
    className = '',
    id,
    name,
    ...props
}) {
    const baseClasses = 'w-full py-1 px-2 text-xs border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1'
    
    const variants = {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 text-red-900',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50 text-green-900'
    }
    
    const disabledClasses = disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-100' 
        : 'hover:border-gray-400'
    
    const classes = `${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`
    
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={classes}
            id={id}
            name={name}
            {...props}
        />
    )
}

export default Input