import { useState } from 'react'
import { TabItem } from '../molecules'
import { Test } from '../atoms'

/**
 * Componente TabManager - Sistema de gestión de pestañas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tabs - Array de pestañas abiertas
 * @param {string} props.activeTab - ID de la pestaña actualmente activa
 * @param {Function} props.onTabClick - Función para cambiar de pestaña activa
 * @param {Function} props.onTabClose - Función para cerrar una pestaña
 * @param {Function} props.onTabsReorder - Función para reordenar pestañas
 * @param {ReactNode} props.children - Contenido a mostrar en la pestaña activa
 *
 */
function TabManager({ tabs, activeTab, onTabClick, onTabClose, onTabsReorder }) {
    const [draggedTab, setDraggedTab] = useState(null)
    const [dragOverTab, setDragOverTab] = useState(null)
    
    const handleDragStart = (e, tabId) => {
        setDraggedTab(tabId)
        e.dataTransfer.effectAllowed = 'move'
    }
    const handleDragOver = (e, tabId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverTab(tabId)
    }
    const handleDragLeave = () => {
        setDragOverTab(null)
    }
    const handleDrop = (e, targetTabId) => {
        e.preventDefault()
        if (draggedTab && draggedTab !== targetTabId) {
            const draggedIndex = tabs.findIndex(tab => tab.id === draggedTab)
            const targetIndex = tabs.findIndex(tab => tab.id === targetTabId)
            const newTabs = [...tabs]
            const [draggedTabObj] = newTabs.splice(draggedIndex, 1)
            newTabs.splice(targetIndex, 0, draggedTabObj)
            onTabsReorder(newTabs)
        }
        setDraggedTab(null)
        setDragOverTab(null)
    }
    const handleDragEnd = () => {
        setDraggedTab(null)
        setDragOverTab(null)
    }
    if (tabs.length === 0) {
        return (
            <div className="flex-1 bg-blue-50 p-2 overflow-auto"></div>
        );
    }

    return (
        <div className="flex-1 bg-blue-50 overflow-hidden flex flex-col">
            <div className="flex items-center px-2 pt-2 overflow-x-auto">
                <div className="flex min-w-max">
                    {tabs.map((tab) => (
                        <TabItem
                            key={tab.id}
                            id={tab.id}
                            title={tab.title}
                            active={activeTab === tab.id}
                            dragging={draggedTab === tab.id}
                            dragOver={dragOverTab === tab.id}
                            onClick={onTabClick}
                            onClose={onTabClose}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-1 px-2 pb-2 overflow-auto -mt-1">
                <div className="h-full bg-white rounded-tr-lg rounded-b-lg shadow-xl p-2 relative z-0">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            style={{ display: activeTab === tab.id ? 'block' : 'none', height: '100%' }}
                        >
                            {typeof tab.content === 'function' ? tab.content() : tab.content}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TabManager