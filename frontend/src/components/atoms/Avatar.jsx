/**
 * Avatar Atom - Avatar circular del usuario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.initials - Iniciales del usuario
 * @param {string} props.src - URL de la imagen (opcional)
 * @param {string} props.size - Tamaño del avatar (sm, md, lg)
 * @param {string} props.className - Clases adicionales
 */
function Avatar({ initials = 'U', src, size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-12 h-12 text-base'
    }
    
    const baseClasses = `
        rounded-full 
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700 
        flex items-center justify-center 
        transition-all duration-200 
        shadow-md hover:shadow-lg
        font-bold text-white
    `
    
    const classes = `${baseClasses} ${sizes[size]} ${className}`
    
    if (src) {
        return (
            <img 
                src={src} 
                alt="Avatar" 
                className={`${classes} object-cover`}
            />
        )
    }
    
    return (
        <div className={classes}>
            <span>{initials}</span>
        </div>
    )
}

export default Avatar