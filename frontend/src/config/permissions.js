// Permisos de menú por rol.
// '*'  -> acceso a todo el sistema (ADMIN).
// Lista -> solo esos ids del menú (ids de Sidebar.jsx, incluidos los submenús).
// Un rol que no esté aquí conserva el menú completo; el backend igual bloquea lo que no le corresponde.
export const MENU_ACCESS = {
    ADMIN: '*',
    ALMACEN: ['inventario', 'inventarioInicial'],
};

// Secciones exclusivas del ADMIN, sin importar el rol.
const ADMIN_ONLY = ['usuarios'];

export function canAccess(rol, menuId) {
    if (ADMIN_ONLY.includes(menuId)) return rol === 'ADMIN';
    const access = MENU_ACCESS[rol];
    if (access === undefined || access === '*') return true;
    return access.includes(menuId);
}
