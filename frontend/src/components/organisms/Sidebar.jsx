
import { useState } from 'react';
import {
    CubeIcon,
    ScaleIcon,
    ClipboardDocumentListIcon,
    BuildingStorefrontIcon,
    ArrowsRightLeftIcon,
    ClipboardIcon,
    ArrowUpRightIcon,
    ArrowDownTrayIcon,
    ArchiveBoxIcon,
    AdjustmentsHorizontalIcon,
    CalendarIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import { NavigationItem } from '../molecules'
import { TruckIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { canAccess } from '../../config/permissions';

/**
 * Componente Sidebar - Barra lateral de navegación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.collapsed - Estado de contracción del sidebar
 * @param {Function} props.onTabOpen - Función para abrir una nueva pestaña
 * 
 */
function Sidebar({ collapsed, onTabOpen }) {
    const { user } = useAuth();
    const allItems = [
        {
            id: 'ingresos',
            title: 'Ingresos',
            icon: ArrowDownTrayIcon,
            subItems: [
                { id: 'compras', title: 'Compras', icon: ClipboardDocumentListIcon }
            ]
        },
        { id: 'traspasos', title: 'Traspasos', icon: ArrowsRightLeftIcon },
        {
            id: 'salidas',
            title: 'Salidas',
            icon: ArrowUpRightIcon,
            subItems: [
                { id: 'salida-produccion', title: 'Salida a producción', icon: ArchiveBoxIcon }
            ]
        },
        {
            id: 'inventario',
            title: 'Inventarios',
            icon: CalendarIcon,
            subItems: [
                { id: 'inventarioInicial', title: 'Inventario Inicial', icon: ClipboardIcon },
                { id: 'inventario', title: 'Inventario', icon: ClipboardIcon }
            ]
        },
        {
            id: 'configuraciones',
            title: 'Configuraciones',
            icon: AdjustmentsHorizontalIcon,
            subItems: [
                { id: 'productos', title: 'Productos', icon: CubeIcon },
                { id: 'unidades', title: 'Unidades de medida', icon: ScaleIcon },
                { id: 'proveedores', title: 'Proveedores', icon: TruckIcon },
                { id: 'almacenes', title: 'Almacenes', icon: BuildingStorefrontIcon }
            ]
        }
    ];

    // Solo se muestran las opciones permitidas para el rol del usuario
    const navigationItems = allItems
        .map((item) => item.subItems
            ? { ...item, subItems: item.subItems.filter((sub) => canAccess(user?.rol, sub.id)) }
            : item)
        .filter((item) => item.subItems ? item.subItems.length > 0 : canAccess(user?.rol, item.id));

    // Multi-expand: openMenu is an object { [id]: boolean }
    const [openMenu, setOpenMenu] = useState({})
    const handleClick = (item) => {
        if (item.subItems) {
            setOpenMenu((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
        } else {
            onTabOpen(item)
        }
    }


    return (
        <aside className={`h-full ${collapsed ? 'w-0' : 'w-56'} bg-slate-700 shadow-lg flex flex-col transition-all duration-300 pt-2`}>
            <nav className="flex flex-col text-xs">
                {navigationItems.map((item) => (
                    <div key={item.id}>
                        <div className="relative">
                            <NavigationItem
                                icon={item.icon}
                                title={item.title}
                                collapsed={collapsed}
                                onClick={() => handleClick(item)}
                            >
                            </NavigationItem>
                                {item.subItems && !collapsed && (
                                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${openMenu[item.id] ? 'rotate-90' : ''}`}>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                                    </span>
                                )}
                        </div>
                        <div
                            className={`overflow-hidden transition-all duration-300 ${item.subItems ? 'mt-1' : ''}`}
                            style={{
                                maxHeight: item.subItems && openMenu[item.id] && !collapsed ? `${item.subItems.length * 44}px` : '0px',
                                opacity: item.subItems && openMenu[item.id] && !collapsed ? 1 : 0
                            }}
                        >
                            {item.subItems && openMenu[item.id] && !collapsed && (
                                <div className="space-y-1">
                                    {item.subItems.map((sub) => (
                                        <NavigationItem
                                            key={sub.id}
                                            icon={sub.icon}
                                            title={sub.title}
                                            collapsed={collapsed}
                                            className='pl-6 '
                                            onClick={() => onTabOpen(sub)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

            </nav>
        </aside>
    )
}

export default Sidebar