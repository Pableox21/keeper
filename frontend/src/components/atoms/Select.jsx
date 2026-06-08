/**
 * Select Atom - Componente de select reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.options - Array de opciones [{value, label}]
 * @param {string} props.value - Valor seleccionado
 * @param {Function} props.onChange - Función de cambio
 * @param {string} props.placeholder - Texto placeholder
 * @param {string} props.variant - Variante del select (default, error, success)
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.className - Clases adicionales
 * @param {string} props.id - ID del select
 * @param {string} props.name - Nombre del select
 */
function Select({
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar...",
    variant = 'default',
    disabled = false,
    className = '',
    id,
    name,
    ...props
}) {
    const baseClasses = 'w-full px-2 py-1 text-xs border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer'
    
    const variants = {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 text-red-900',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50 text-green-900'
    }
    
    const disabledClasses = disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-100' 
        : 'hover:border-gray-400'
    
    const classes = `${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`
    
    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value, e)
        }
    }
    
    return (
        <select
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className={classes}
            id={id}
            name={name}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((option, index) => (
                <option 
                    key={option.value || index} 
                    value={option.value}
                >
                    {option.label || option.value}
                </option>
            ))}
        </select>
    )
}

export default Select