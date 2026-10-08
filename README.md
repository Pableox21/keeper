# Keeper

Sistema web de gestión de inventarios: compras, traspasos entre almacenes, salidas a producción, inventario inicial y control de stock por almacén.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite, Tailwind CSS, DaisyUI |
| Backend | Node.js 20, Express 5 |
| Base de datos | MariaDB 11 |
| Autenticación | Sesiones con token (tabla `sessions`) y contraseñas con bcrypt |
| Despliegue | Docker Compose |

## Estructura del proyecto

```
keeper/
├── backend/            API REST (Express)
│   └── src/
│       ├── config/         db.js, defaultUser.js
│       ├── controllers/    lógica de cada módulo
│       ├── middleware/     authMiddleware.js (sesión y roles)
│       └── routes/         endpoints /api/*
├── frontend/           Aplicación React
│   └── src/
│       ├── api/            llamadas al backend
│       ├── config/         permissions.js (menú por rol)
│       ├── components/     atoms, molecules y organisms
│       └── pages/          Login y Dashboard
├── database/
│   ├── schemas/        esquema completo
│   └── migrations/     migraciones numeradas
├── docker-compose.yml
└── .env                variables de entorno (no subir a git)
```

## Puesta en marcha

### Requisitos
- Docker y Docker Compose

### Pasos
1. Crea el archivo `.env` en la raíz (ver [Variables de entorno](#variables-de-entorno)).
2. Levanta los servicios:
   ```bash
   docker compose up --build
   ```
3. Abre la aplicación.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3110 |
| Backend (API) | http://localhost:3210 |
| MariaDB | localhost:3310 |

Al arrancar, el backend crea el usuario por defecto si todavía no existe.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a la base de datos principal |
| `DB_ROOT_PASSWORD` | Contraseña root de MariaDB (la usa el contenedor) |
| `DB_OPTIMUS_*` | Conexión a la base de datos secundaria (Optiweb) |
| `PORT` | Puerto interno del backend (por defecto `3000`) |
| `SESSION_INACTIVITY_MINUTES` | Minutos de inactividad antes de cerrar la sesión (por defecto `180`) |
| `DEFAULT_USER_USERNAME` | Usuario por defecto (`kepeer123`) |
| `DEFAULT_USER_EMAIL` | Email del usuario por defecto (`kepeer123@keeper.com`) |
| `DEFAULT_USER_PASSWORD` | Contraseña del usuario por defecto (`123456`) |
| `DEFAULT_USER_NAME` | Nombre completo del usuario por defecto |
| `VITE_API_URL` | URL del backend que usa el frontend |

## Usuario por defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `kepeer123` | `123456` | ADMIN |

- Se crea **solo si no existe**. Si luego cambias su contraseña, el backend no la vuelve a pisar al reiniciar.
- Es un usuario pensado para desarrollo. **Cambia la contraseña antes de usar el sistema en producción.**

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Control total del sistema, incluida la gestión de usuarios |
| `ALMACEN` | Solo el área de **Inventarios** (Inventario Inicial e Inventario) |
| `SUPERVISOR`, `USUARIO`, `SOLO_LECTURA` | Solo lectura en el backend; el menú aún no está restringido |

Detalle del rol `ALMACEN`:

- **Puede:** consultar inventario, almacenes, productos y catálogos; crear y editar ingresos (los usa Inventario Inicial).
- **No puede:** compras, traspasos, salidas, proveedores, configuraciones ni borrados. El backend responde `403 Permiso denegado` y el menú no muestra esas opciones.
- Las altas, ediciones y bajas de productos, almacenes, catálogos (categorías, marcas, líneas, unidades, empresas) y proveedores son solo para `ADMIN`.

Los permisos se aplican en dos lugares:
- **Backend:** `backend/src/routes/*.js` con `requireRole(...)` y `denyRoles(...)` de `middleware/authMiddleware.js`.
- **Frontend (menú):** `frontend/src/config/permissions.js`.

> Compras e Inventario Inicial comparten el endpoint `/api/ingresos`, por lo que el backend no los distingue: un usuario `ALMACEN` podría crear un ingreso de compra por API aunque no vea esa pantalla.

## Gestión de usuarios

Desde el menú lateral, la opción **Usuarios** (visible solo para `ADMIN`) abre una pantalla con la lista de usuarios, su rol, estado y último acceso. Desde ahí se puede:

- **Crear** un usuario eligiendo su rol.
- **Editar** usuario, nombre, email y rol. La contraseña es opcional: si se deja vacía no cambia.
- **Deshabilitar / Habilitar** un usuario. Al deshabilitarlo se cierran sus sesiones abiertas y ya no puede iniciar sesión.

Reglas de seguridad:
- Un administrador no puede deshabilitarse a sí mismo ni cambiar su propio rol, para no dejar el sistema sin administrador.
- Al cambiar la contraseña de un usuario se cierran sus sesiones abiertas.

## API de autenticación

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve el token |
| POST | `/api/auth/logout` | Sesión | Cierra la sesión |
| POST | `/api/auth/register` | Público | Registro de usuario (siempre con rol `USUARIO`, máx. 10 intentos cada 15 min) |
| GET | `/api/auth/users` | `ADMIN` | Lista todos los usuarios |
| POST | `/api/auth/users` | `ADMIN` | Crea un usuario eligiendo el rol |
| PUT | `/api/auth/users/:id` | `ADMIN` | Edita usuario, email, nombre, rol y, opcionalmente, la contraseña |
| PATCH | `/api/auth/users/:id/estado` | `ADMIN` | Habilita (`ACTIVO`) o deshabilita (`INACTIVO`) un usuario |

Las rutas protegidas reciben el token en la cabecera `Authorization: Bearer <token>`.

### Iniciar sesión

```bash
curl -X POST http://localhost:3210/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kepeer123","password":"123456"}'
```

### Crear un usuario de almacén (como ADMIN)

```bash
curl -X POST http://localhost:3210/api/auth/users \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"almacen1","email":"almacen1@keeper.com","password":"almacen123","rol":"ALMACEN"}'
```

Validaciones: `username` de 3 a 50 caracteres, email válido, contraseña de al menos 6 caracteres y `username`/`email` únicos.

## Base de datos

Las migraciones están en `database/migrations/` y se aplican en orden numérico. Con una base nueva, Docker carga `007_productos_update.sql` y `008_rol_almacen.sql` automáticamente.

Si ya tienes una base creada, aplica la migración del rol `ALMACEN` una sola vez:

```bash
docker exec -i keeper-db sh -c 'mariadb -uroot -p"$DB_ROOT_PASSWORD"' < database/migrations/008_rol_almacen.sql
```

## Desarrollo sin Docker

```bash
# Backend (puerto 3000 por defecto)
cd backend && npm install && npm start

# Frontend (puerto 5173)
cd frontend && npm install && npm run dev
```

Necesitas una instancia de MariaDB con la base cargada y las variables de entorno configuradas.

## Seguridad

- No subas el `.env` al repositorio.
- Cambia las credenciales por defecto en producción.
- Mantén `VITE_API_URL` apuntando al backend correcto en cada entorno.
