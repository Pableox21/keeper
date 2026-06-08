/**
 * Icon Atom - Wrapper para iconos Heroicons
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactComponent} props.icon - Componente de icono de Heroicons
 * @param {string} props.size - Tamaño del icono (xs, sm, md, lg, xl)
 * @param {string} props.color - Color del icono
 * @param {string} props.className - Clases adicionales
 */
function Icon({ icon: IconComponent, size = 'md', color = 'currentColor', className = '' }) {
    const sizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    }
    
    const classes = `${sizes[size]} ${className}`
    
    if (!IconComponent) {
        return null
    }
    
    return (
        <IconComponent 
            className={classes}
            style={{ color }}
        />
    )
}

export default Icon