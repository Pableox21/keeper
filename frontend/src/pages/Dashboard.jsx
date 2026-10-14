import { useState } from 'react'
import Header from '../components/organisms/Header'
import Sidebar from '../components/organisms/Sidebar'
import TabManager from '../components/organisms/TabManager'
import Products from '../components/organisms/Products'
import Compras from '../components/organisms/Compras'
import UnitsOfMeasure from '../components/organisms/UnitsOfMeasure'
import Suppliers from '../components/organisms/suppliers'
import ProductionOutput from '../components/organisms/ProductionOutput'
import Warehouses from '../components/organisms/Warehouses'
import Transfers from '../components/organisms/Transfers'
import InitialInventory from '../components/organisms/InitialInventory'
import Inventory from '../components/organisms/Inventory'
import Users from '../components/organisms/Users'
import Profile from '../components/organisms/Profile'
import { useAuth } from '../hooks/useAuth'
import { canAccess } from '../config/permissions'

function Dashboard() {
    const { user } = useAuth()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [tabs, setTabs] = useState([])
    const [activeTab, setActiveTab] = useState(null)

    /**
     * Maneja la apertura de una nueva pestaña desde el sidebar
     * @param {Object} tabData - Datos de la pestaña (id, title, icon)
     */
    const handleTabOpen = (tabData) => {
        const existingTab = tabs.find(tab => tab.id === tabData.id)
        if (existingTab) {
            setActiveTab(tabData.id)
            return
        }
        setTabs(prevTabs => [...prevTabs, tabData])
        setActiveTab(tabData.id)
    }

    /**
     * Maneja el cierre de una pestaña
     * @param {string} tabId - ID de la pestaña a cerrar
     */
    const handleTabClose = (tabId) => {
        setTabs(prevTabs => {
            const newTabs = prevTabs.filter(tab => tab.id !== tabId)
            if (activeTab === tabId && newTabs.length > 0) {
                setActiveTab(newTabs[newTabs.length - 1].id)
            } else if (newTabs.length === 0) {
                setActiveTab(null)
            }
            return newTabs
        })
    }

    /**
     * Maneja el reordenamiento de pestañas por drag & drop
     * @param {Array} newTabs - Nuevo orden de pestañas
     */
    const handleTabsReorder = (newTabs) => {
        setTabs(newTabs)
    }

    // Generar el contenido de cada pestaña para mantener el estado
    const getTabContent = (tab) => {
        if (!canAccess(user?.rol, tab.id)) {
            return (
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Acceso denegado</h2>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
                </div>
            )
        }
        switch (tab.id) {
            case 'productos':
                return <Products />;
            case 'compras':
                return <Compras />;
            case 'unidades':
                return <UnitsOfMeasure />
            case 'proveedores':
                return <Suppliers />
            case 'salida-produccion':
                return <ProductionOutput />;
            case 'almacenes':
                return <Warehouses />;
            case 'traspasos':
                return <Transfers />;
            case 'inventario':
                return <Inventory />
            case 'inventarioInicial':
                return <InitialInventory />
            case 'usuarios':
                return <Users />
            case 'perfil':
                return <Profile />
            
            default:
                return (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            {tab.icon && <tab.icon className="w-6 h-6 text-blue-500" />}
                            <h1 className="text-2xl font-bold text-gray-800">{tab.title}</h1>
                        </div>
                        <p className="text-gray-600">
                            Contenido de la sección: <strong>{tab.title}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                            Aquí puedes agregar el contenido específico para esta sección como formularios,
                            tablas, gráficos, etc.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col w-screen h-screen">
            <Header
                onToggleSidebar={() => setSidebarCollapsed(s => !s)}
                onOpenProfile={() => handleTabOpen({ id: 'perfil', title: 'Mi perfil' })}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar collapsed={sidebarCollapsed} onTabOpen={handleTabOpen} />
                <TabManager
                    tabs={tabs.map(tab => ({ ...tab, content: getTabContent(tab) }))}
                    activeTab={activeTab}
                    onTabClick={setActiveTab}
                    onTabClose={handleTabClose}
                    onTabsReorder={handleTabsReorder}
                />
            </div>
        </div>
    )
}

export default Dashboard
