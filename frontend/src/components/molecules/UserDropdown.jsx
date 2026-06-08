import { Avatar, Button, Icon } from '../atoms'

/**
 * UserDropdown Molecule - Avatar con menú desplegable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.initials - Iniciales del usuario
 * @param {string} props.userName - Nombre del usuario (opcional)
 * @param {string} props.userRole - Rol del usuario (opcional)
 * @param {string} props.avatarSrc - URL de imagen del avatar (opcional)
 * @param {Function} props.onProfile - Función para ir a perfil
 * @param {Function} props.onLogout - Función para cerrar sesión
 * @param {string} props.className - Clases adicionales
 */
function UserDropdown({ 
    initials = 'U', 
    userName,
    userRole,
    avatarSrc, 
    onProfile, 
    onLogout, 
    className = '' 
}) {
    return (
        <div className={`relative group ${className}`}>
            <button className="cursor-pointer">
                <Avatar 
                    initials={initials}
                    src={avatarSrc}
                    size="md"
                />
            </button>
            
            {/* Menú dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {/* Información del usuario */}
                {userName && (
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        {userRole && (
                            <p className="text-xs text-gray-500">{userRole}</p>
                        )}
                    </div>
                )}
                
                <Button
                    variant="ghost"
                    onClick={onProfile}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 transition-colors duration-200 flex items-center gap-3 rounded-none"
                >
                    <Icon 
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                        size="sm"
                    />
                    Perfil
                </Button>
                
                <Button
                    variant="ghost"
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 transition-colors duration-200 flex items-center gap-3 rounded-none"
                >
                    <Icon 
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                        size="sm"
                    />
                    Cerrar sesión
                </Button>
            </div>
        </div>
    )
}

export default UserDropdown