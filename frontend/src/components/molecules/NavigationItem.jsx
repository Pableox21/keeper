import { Button, Icon } from '../atoms'

/**
 * NavigationItem Molecule - Item de navegación del sidebar
 * 
 * @param {Object} props - Propiedades del componente
 * @param {ReactComponent} props.icon - Componente de icono
 * @param {string} props.title - Título del item
 * @param {Function} props.onClick - Función de click
 * @param {boolean} props.collapsed - Estado colapsado del sidebar
 * @param {boolean} props.active - Item activo
 * @param {string} props.className - Clases adicionales
 */
function NavigationItem({ 
    icon, 
    title, 
    onClick, 
    collapsed = false, 
    active = false,
    className = '',
    rightIcon = null
}) {
    const itemClasses = `
        flex items-center gap-2 p-2 w-full
        hover:bg-slate-800 hover:text-white 
        focus:bg-slate-800 focus:text-white
        active:bg-slate-800 active:text-white
        transition-all duration-300 text-white 
        ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'} 
        overflow-hidden whitespace-nowrap
        ${active ? 'bg-slate-800' : ''}
        ${className}
    `
    
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={itemClasses}
            style={{ width: '100%' }}
            tabIndex={0}
        >
            <Icon 
                icon={icon} 
                size="sm" 
                color="#60a5fa" // text-blue-400 
            />
            <span className="flex-1 text-left">{title}</span>
            {rightIcon}
        </Button>
    )
}

export default NavigationItem