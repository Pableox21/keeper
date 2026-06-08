import { Input } from '../atoms'

/**
 * FormField Molecule - Componente de campo de formulario con label e input
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Texto del label
 * @param {ReactNode} props.children - Componente hijo (Select, Input personalizado, etc.)
 * @param {string} props.type - Tipo de input (text, email, password, number, etc.) - solo si no hay children
 * @param {string} props.placeholder - Texto placeholder - solo si no hay children
 * @param {string} props.value - Valor del input - solo si no hay children
 * @param {Function} props.onChange - Función de cambio - solo si no hay children
 * @param {string} props.variant - Variante del input (default, error, success)
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.layout - Diseño del label (top, side)
 * @param {boolean} props.required - Campo requerido
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helper - Texto de ayuda
 * @param {string} props.className - Clases adicionales para el contenedor
 * @param {string} props.id - ID del input
 * @param {string} props.name - Nombre del input
 */
function FormField({
    label,
    type = 'text',
    placeholder = '',
    value,
    onChange,
    variant = 'default',
    disabled = false,
    layout = 'top',
    required = false,
    error,
    helper,
    className = '',
    labelClassName = '',
    id,
    name,
    children,
    inputWrapperClassName = '',
    ...props
}) {
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
    const inputVariant = error ? 'error' : variant
    const containerClasses = layout === 'side' 
        ? `flex items-center gap-2 ${className}`
        : `flex flex-col gap-2 ${className}`
    const labelClasses = `text-xs font-medium text-gray-700 ${required ? "after:content-['*'] after:ml-1 after:text-red-500" : ''} ${labelClassName}`
    
    return (
        <div className={containerClasses}>
            {label && (
                <label 
                    htmlFor={fieldId} 
                    className={labelClasses}
                >
                    {label}
                </label>
            )}
            <div className={`flex-1 ${inputWrapperClassName}`}>
                {children ? (
                    children
                ) : (
                    <Input
                        id={fieldId}
                        name={name || fieldId}
                        type={type}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        variant={inputVariant}
                        disabled={disabled}
                        {...props}
                    />
                )}
                {error && (
                    <p className="mt-1 text-xs text-red-600">
                        {error}
                    </p>
                )}
                {helper && !error && (
                    <p className="mt-1 text-xs text-gray-500">
                        {helper}
                    </p>
                )}
            </div>
        </div>
    )
}

export default FormField