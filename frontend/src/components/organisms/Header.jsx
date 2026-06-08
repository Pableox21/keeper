import { Bars3Icon } from "@heroicons/react/24/solid"
import { Button, Logo } from '../atoms'
import { UserDropdown } from '../molecules'
import { useAuth } from '../../hooks/useAuth'

/**
 * Componente Header - Barra superior de la aplicación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onToggleSidebar - Función para alternar la visibilidad del sidebar
 * 
 */
function Header({ onToggleSidebar }) {
    const { user, logout } = useAuth();

    const handleProfile = () => {
        console.log('Ir a perfil')
    }

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    }

    return (
        <header className="flex bg-white shadow-md p-2 gap-x-2">
            <Button
                variant="secondary"
                onClick={onToggleSidebar}
                className="p-2"
            >
                <Bars3Icon className="h-4 w-4 text-black" />
            </Button>
            <div className="flex flex-row items-center flex-1">
                <Logo size="md" showIcon={true} />
            </div>
            <div className="flex-none flex items-center gap-2">
                <UserDropdown
                    initials={user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    userName={user?.username}
                    userRole={user?.rol}
                    onProfile={handleProfile}
                    onLogout={handleLogout}
                />
            </div>
        </header>
    )
}

export default Header