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
| `ALMACEN` | Todas las pantallas de inventario (compras, traspasos, salidas, inventario, productos, unidades, proveedores, almacenes), con creación, edición y borrado. **Sin acceso a Clientes ni a Usuarios** |
| `ATENCION_CLIENTE` | Solo el área de **Clientes** |

Detalle del rol `ALMACEN`:

- **Puede:** consultar y escribir (crear, editar, eliminar) en ingresos, compras, traspasos, salidas a producción, inventario, productos, unidades de medida, proveedores y almacenes.
- **No puede:** abrir Clientes ni gestionar Usuarios. El backend responde `403 Permiso denegado` y el menú no muestra esas opciones.
- La creación, edición, deshabilitación y borrado de usuarios es exclusiva de `ADMIN`.

Los permisos se aplican en dos lugares:
- **Backend:** `backend/src/routes/*.js` con `requireRole(...)` y `denyRoles(...)` de `middleware/authMiddleware.js`.
- **Frontend (menú):** `frontend/src/config/permissions.js`.

> Compras e Inventario Inicial comparten el endpoint `/api/ingresos`, por lo que un usuario `ALMACEN` escribe ingresos de compra desde Inventario Inicial con los mismos permisos que en la pantalla de Compras.

## Gestión de clientes

La opción **Clientes** del menú lateral abre la pantalla de gestión de clientes del servicio de internet. Cada cliente tiene:

| Campo | Detalle |
|-------|---------|
| N° de contrato | Obligatorio y único |
| Nombre completo | Obligatorio, solo letras (con tildes y ñ), espacios y los signos `. ' -`; sin números |
| CI | Obligatorio, solo dígitos (5 a 10) |
| Complemento del CI | Opcional, de 1 a 3 letras o números (ej. `1A`) |
| Celular | 8 dígitos, empieza con 6 o 7 |
| Zona | Sipe Sipe, Suticollo o Mallco Chapi |
| Plan de internet | Económico, Medio, Premium o Gamer |
| Estado | Activo o Desactivado |

Desde la pantalla se puede **crear**, **editar**, **activar / desactivar** y **eliminar** clientes, y buscar por contrato, nombre, CI, celular, zona o plan. Eliminar es definitivo y pide confirmación; para conservar el historial de un cliente conviene desactivarlo en lugar de eliminarlo.

Permisos: los usuarios con rol `ADMIN` o `ATENCION_CLIENTE` pueden crear, editar, cambiar el estado y eliminar; el rol `ALMACEN` no tiene acceso a este módulo.

## Perfil de usuario

Cualquier usuario (de cualquier rol) puede abrir su perfil desde el avatar de la esquina superior derecha, en la opción **Perfil**. Se abre la pestaña **Mi perfil** con sus datos: nombre completo, email, teléfono, CI, departamento, usuario, rol, estado, fecha de alta y última actividad.

## Validaciones de campos

Todos los formularios validan los datos en **dos lugares**: en el navegador (los caracteres no permitidos simplemente no se pueden escribir) y en el servidor (que vuelve a validar y responde con un mensaje claro, así no se pueden saltar usando la API directamente).

| Campo | Regla |
|-------|-------|
| Nombres de persona (usuario, cliente) | Solo letras (con tildes y ñ), espacios y `. ' -`; mínimo 3 caracteres. Sin números ni símbolos |
| Usuario (login) | 3 a 50 caracteres: letras, números y `. _ -`, sin espacios |
| Contraseña | De 6 a 72 caracteres |
| Email | Formato válido (`nombre@dominio.com`), máximo 255 caracteres |
| Celular de cliente | 8 dígitos que empiecen con 6 o 7 |
| Teléfonos (proveedores, almacenes) | 7 u 8 dígitos; se aceptan espacios, guiones, paréntesis y el prefijo `+591` |
| CI y NIT | Solo dígitos (CI de 5 a 10; NIT de 5 a 20) |
| Códigos (producto, proveedor, almacén) | Letras, números, espacios y `. , _ - / # ( ) + : %`; máximo 50 |
| Números de contrato | Letras, números y `. / -`; máximo 30 |
| Stock mínimo / máximo | Enteros mayores o iguales a 0; el máximo no puede ser menor al mínimo |
| Cantidades (ingresos, traspasos, salidas) | Enteros positivos; los ingresos admiten líneas en 0 si hay al menos una con cantidad |
| Precios | Mayores o iguales a 0, con 2 decimales (se redondean) |
| Fechas y horas | Fecha válida `AAAA-MM-DD` (no futura) y hora `HH:MM` |
| Estados, tipos y roles | Solo los valores permitidos de cada lista |
| Textos | Sin caracteres de control y con el largo máximo de cada columna de la base de datos |

Reglas adicionales:
- **Ingresos (compras):** el servidor calcula siempre el total a partir del detalle.
- **Traspasos y salidas:** el origen y el destino no pueden ser el mismo, y un producto no puede repetirse en el detalle (juntar las cantidades en una sola línea).
- **Ids de la URL:** deben ser enteros positivos.

Dónde está el código:
- Backend: `backend/src/utils/validator.js` (reglas reutilizables) y `backend/src/middleware/validate.js` (validación por módulo, conectada en `backend/src/routes/*.js`).
- Frontend: `frontend/src/utils/fieldRules.js` (restricciones al escribir).

## Gestión de usuarios

Desde el menú lateral, la opción **Usuarios** (visible solo para `ADMIN`) abre una pantalla con la lista de usuarios, su rol, estado y último acceso. Desde ahí se puede:

- **Crear** un usuario eligiendo su rol.
- **Editar** usuario, nombre, email y rol. La contraseña es opcional: si se deja vacía no cambia.
- **Deshabilitar / Habilitar** un usuario. Al deshabilitarlo se cierran sus sesiones abiertas y ya no puede iniciar sesión.
- **Eliminar** un usuario de forma definitiva (pide confirmación).

Reglas de seguridad:
- Un administrador no puede deshabilitarse a sí mismo ni cambiar su propio rol, para no dejar el sistema sin administrador.
- Al cambiar la contraseña de un usuario se cierran sus sesiones abiertas.
- Un administrador no puede eliminarse a sí mismo, y el usuario por defecto no se puede eliminar (se vuelve a crear al iniciar el sistema).
- Un usuario que ya figura como responsable en ingresos, salidas o traspasos no se puede eliminar: el sistema avisa y conviene **deshabilitarlo** en su lugar.

## API de autenticación

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve el token |
| POST | `/api/auth/logout` | Sesión | Cierra la sesión |
| GET | `/api/auth/me` | Sesión | Devuelve los datos del perfil del usuario con sesión iniciada |
| GET | `/api/auth/users` | `ADMIN` | Lista todos los usuarios |
| POST | `/api/auth/users` | `ADMIN` | Crea un usuario eligiendo el rol (obligatorio: `ADMIN`, `ALMACEN` o `ATENCION_CLIENTE`) |
| PUT | `/api/auth/users/:id` | `ADMIN` | Edita usuario, email, nombre, rol y, opcionalmente, la contraseña |
| PATCH | `/api/auth/users/:id/estado` | `ADMIN` | Habilita (`ACTIVO`) o deshabilita (`INACTIVO`) un usuario |
| DELETE | `/api/auth/users/:id` | `ADMIN` | Elimina definitivamente un usuario |

Las rutas protegidas reciben el token en la cabecera `Authorization: Bearer <token>`.

No hay registro público: las cuentas nuevas solo las crea un `ADMIN` desde la pantalla **Usuarios**.

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

## API de clientes

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/clientes` | Sesión (excepto `ALMACEN`) | Lista los clientes |
| POST | `/api/clientes` | `ADMIN`, `ATENCION_CLIENTE` | Crea un cliente |
| PUT | `/api/clientes/:id` | `ADMIN`, `ATENCION_CLIENTE` | Edita un cliente |
| PATCH | `/api/clientes/:id/estado` | `ADMIN`, `ATENCION_CLIENTE` | Activa (`ACTIVO`) o desactiva (`INACTIVO`) un cliente |
| DELETE | `/api/clientes/:id` | `ADMIN`, `ATENCION_CLIENTE` | Elimina definitivamente un cliente |

## Base de datos

Las migraciones están en `database/migrations/` y se aplican en orden numérico. Con una base nueva, Docker carga `007_productos_update.sql` y después `008_rol_almacen.sql`, `009_clientes.sql`, `010_rol_atencion_cliente.sql` y `011_roles_tres_almacen.sql` automáticamente.

Al arrancar, el backend aplica solo los cambios de esquema que necesita (`backend/src/config/ensureSchema.js`): deja la restricción de roles de `usuario` en `ADMIN`, `ALMACEN` y `ATENCION_CLIENTE` (las cuentas con roles retirados pasan a `ALMACEN` y quedan `INACTIVO`) y crea la tabla `cliente_internet`. Es seguro repetirlo: si ya están aplicados, no hace nada. Por eso, en una base existente basta con reconstruir y reiniciar:

```bash
docker compose up --build
```

Si prefieres aplicar las migraciones a mano, la contraseña de root dentro del contenedor está en `MARIADB_ROOT_PASSWORD`:

```bash
# Linux, macOS o Git Bash
docker exec -i keeper-db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"' < database/migrations/008_rol_almacen.sql
docker exec -i keeper-db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"' < database/migrations/009_clientes.sql
```

```powershell
# PowerShell
Get-Content database/migrations/008_rol_almacen.sql -Raw | docker exec -i keeper-db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"'
Get-Content database/migrations/009_clientes.sql -Raw | docker exec -i keeper-db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"'
```

> La tabla `cliente` del esquema original es distinta y la usa una llave foránea, por eso el módulo de clientes usa la tabla nueva `cliente_internet`.

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
