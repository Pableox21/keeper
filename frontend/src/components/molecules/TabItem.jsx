import { Button, Icon } from '../atoms'
import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * TabItem Molecule - Pestaña individual con título y botón cerrar
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.id - ID único de la pestaña
 * @param {string} props.title - Título de la pestaña
 * @param {boolean} props.active - Si la pestaña está activa
 * @param {boolean} props.dragging - Si está siendo arrastrada
 * @param {boolean} props.dragOver - Si se está arrastrando algo encima
 * @param {Function} props.onClick - Función al hacer click en la pestaña
 * @param {Function} props.onClose - Función para cerrar la pestaña
 * @param {Function} props.onDragStart - Función inicio de arrastrar
 * @param {Function} props.onDragOver - Función arrastrar encima
 * @param {Function} props.onDragLeave - Función salir del área de arrastrar
 * @param {Function} props.onDrop - Función soltar
 * @param {Function} props.onDragEnd - Función fin de arrastrar
 */
function TabItem({ 
    id,
    title,
    active = false,
    dragging = false,
    dragOver = false,
    onClick,
    onClose,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd
}) {
    const tabClasses = `
        relative group flex items-center gap-2 px-1 pt-1 pb-2 cursor-pointer
        transition-all duration-200 min-w-max max-w-48
        ${active 
            ? 'bg-white text-slate-700 relative z-10' 
            : 'bg-slate-200 hover:bg-slate-300 text-slate-600 mr-1'
        }
        ${dragOver ? 'bg-blue-100' : ''}
        ${dragging ? 'opacity-50' : ''}
    `
    
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart?.(e, id)}
            onDragOver={(e) => onDragOver?.(e, id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, id)}
            onDragEnd={onDragEnd}
            className={tabClasses}
            onClick={() => onClick?.(id)}
        >
            <span className="truncate text-xs font-medium">{title}</span>
            
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation()
                    onClose?.(id)
                }}
                className="group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded transition-all duration-200"
            >
                <Icon icon={XMarkIcon} size="xs" />
            </Button>
        </div>
    )
}

export default TabItem