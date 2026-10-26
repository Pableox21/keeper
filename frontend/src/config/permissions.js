// Permisos de menú por rol.
// '*'  -> acceso a todo el sistema.
// Lista -> solo esos ids del menú (ids de Sidebar.jsx, incluidos los submenús).
// Un rol que no esté aquí conserva el menú completo; el backend igual bloquea lo que no le corresponde.
export const MENU_ACCESS = {
    ADMIN: '*',
    ALMACEN: '*',
    ATENCION_CLIENTE: ['clientes'],
};

// Partes del menú vetadas a un rol aunque tenga acceso '*'.
const MENU_DENIED = {
    ALMACEN: ['clientes'],
};

// Secciones exclusivas del ADMIN, sin importar el rol.
const ADMIN_ONLY = ['usuarios'];

// Secciones disponibles para cualquier usuario con sesión iniciada.
const ALWAYS_ALLOWED = ['perfil'];

export function canAccess(rol, menuId) {
    if (ALWAYS_ALLOWED.includes(menuId)) return true;
    if (ADMIN_ONLY.includes(menuId)) return rol === 'ADMIN';
    if (MENU_DENIED[rol]?.includes(menuId)) return false;
    const access = MENU_ACCESS[rol];
    if (access === undefined || access === '*') return true;
    return access.includes(menuId);
}
