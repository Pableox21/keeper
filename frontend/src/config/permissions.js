// Permisos de menú por rol.
// '*'  -> acceso a todo el sistema (ADMIN).
// Lista -> solo esos ids del menú (ids de Sidebar.jsx, incluidos los submenús).
// Un rol que no esté aquí conserva el menú completo; el backend igual bloquea lo que no le corresponde.
export const MENU_ACCESS = {
    ADMIN: '*',
    ALMACEN: ['inventario', 'inventarioInicial'],
};

export function canAccess(rol, menuId) {
    const access = MENU_ACCESS[rol];
    if (access === undefined || access === '*') return true;
    return access.includes(menuId);
}
