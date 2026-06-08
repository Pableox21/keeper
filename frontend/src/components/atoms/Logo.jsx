import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/solid"

/**
 * Logo Atom - Logo de la aplicación KEEPER
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.size - Tamaño del logo (sm, md, lg)
 * @param {boolean} props.showIcon - Mostrar ícono junto al texto
 * @param {string} props.className - Clases adicionales
 */
function Logo({ size = 'md', showIcon = true, className = '' }) {
    const sizes = {
        sm: 'text-lg',
        md: 'text-xl', 
        lg: 'text-2xl'
    }
    
    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    }
    
    const classes = `flex items-center font-bold text-black ${sizes[size]} ${className}`
    
    return (
        <div className={classes}>
            <span>KEEPER</span>
            {showIcon && (
                <ArchiveBoxArrowDownIcon className={`ml-1 ${iconSizes[size]} text-black`} />
            )}
        </div>
    )
}

export default Logo