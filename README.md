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
│   ├── scripts/        export-sqlite.mjs (volcado de la base a .sqlite)
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
│   ├── migrations/     migraciones numeradas
│   ├── externa/        segunda base (técnicos, OLTS y contratos)
│   └── export/         archivos .sqlite generados por el script (fuera de git)
├── docker-compose.yml
└── .env                variables de entorno (fuera de git; plantilla en .env.example)
```

## Puesta en marcha

### Requisitos
- Docker y Docker Compose
- Node.js 22.5 o superior en la máquina solo para `backend/scripts/export-sqlite.mjs` (el volcado a SQLite); el resto del proyecto corre dentro de Docker

### Pasos
1. Copia `.env.example` a `.env` y completa las contraseñas (`cp .env.example .env`).
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
| `DB_EXTERNA_*` | Conexión a la base de datos externa secundaria (técnicos, OLTS y contratos de otra empresa) |
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
| N° de contrato | Obligatorio, único y solo dígitos (máximo 30) |
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
| Números de contrato (clientes) | Solo dígitos; máximo 30 |
| Stock mínimo / máximo | Enteros mayores o iguales a 0; el máximo no puede ser menor al mínimo |
| Cantidades (ingresos, traspasos, salidas) | Enteros mayores o iguales a 1: ninguna línea de detalle admite 0 |
| Precios | Mayores o iguales a 0, con 2 decimales (se redondean). En el detalle de un ingreso el precio de la línea debe ser mayor a 0 |
| Fechas y horas | Fecha válida `AAAA-MM-DD` (no futura) y hora `HH:MM` |
| Estados, tipos y roles | Solo los valores permitidos de cada lista |
| Textos | Sin caracteres de control y con el largo máximo de cada columna de la base de datos |

Reglas adicionales:
- **Productos:** la empresa, la categoría y la unidad de medida son obligatorias (las columnas no admiten nulo y tienen clave foránea). El texto `unidad_ingreso` no lo envía la pantalla: el servidor lo deriva del nombre de la unidad elegida y siempre lo lee a través de `unidad_medida`, por lo que una unidad renombrada se muestra con su nombre actual. El estado guardado no se pisa al editar: si el request no incluye un campo, se conserva su valor anterior.
- **Ingresos (compras):** el servidor calcula siempre el total a partir del detalle (el `total` que envía la pantalla se ignora). Un producto no puede repetirse en el detalle, el proveedor y el almacén deben existir, y la forma de pago es una de la lista fija (`NULL` cuando se deja vacía). El responsable es el usuario con sesión iniciada si la pantalla no envía otro.
- **Editar o eliminar un ingreso:** solo se permite si el stock que registró sigue disponible en el almacén. Si alguna salida o traspaso ya consumió parte de él, la operación se detiene y avisa cuánto stock hace falta descargar antes, dejando el ingreso intacto.
- **Pantallas de ingresos:** Compras elige el almacén entre los activos; Inventario Inicial permite elegir proveedor y almacén destino en la barra superior (por defecto el autorizado y el principal) y valida todo el archivo Excel antes de escribir en la base, de modo que una fila con cantidad o precio en 0, un código repetido o un destino inexistivo abortan la importación sin dejar productos creados a medias.
- **Traspasos y salidas:** el origen y el destino no pueden ser el mismo, y un producto no puede repetirse en el detalle (juntar las cantidades en una sola línea).
- **Ids de la URL:** deben ser enteros positivos.

Dónde está el código:
- Backend: `backend/src/utils/validator.js` (reglas reutilizables) y `backend/src/middleware/validate.js` (validación por módulo, conectada en `backend/src/routes/*.js`).
- Frontend: `frontend/src/utils/fieldRules.js` (restricciones al escribir).

## Estados de traspasos y salidas

El stock solo se mueve con el **estado** del movimiento, no con su creación. Las pantallas muestran la columna **Estado** y ofrecen los botones correspondientes.

**Traspasos** (`PENDIENTE → PROCESADO → COMPLETADO`, o `CANCELADO`):

| Estado | Efecto en el stock |
|--------|--------------------|
| `PENDIENTE` | Ninguno: se crea sin tocar inventario |
| `PROCESADO` | Ninguno: queda listo para ejecutar |
| `COMPLETADO` | Descuenta del almacén origen y suma al destino |
| `CANCELADO` | Si venía de `COMPLETADO` devuelve el stock a su almacén origen; si no, no hay nada que devolver |

**Salidas a producción** (`PENDIENTE → ENTREGADA`, o `CANCELADA`):

| Estado | Efecto en el stock |
|--------|--------------------|
| `PENDIENTE` | Ninguno |
| `ENTREGADA` | Descuenta del almacén de origen |
| `CANCELADA` | Si venía de `ENTREGADA` devuelve el stock; desde `PENDIENTE` no toca nada. Desde la pantalla se puede **volver a entregar** |

Reglas aplicadas en `cambiarEstadoTraspaso` y `cambiarEstadoSalida`:

- Cada cambio de estado lee el stock con `SELECT ... FOR UPDATE` dentro de la transacción y lo comprueba antes de escribir: si no alcanza, responde `400` con cuánto falta y la transacción se revierte por completo (no quedan movimientos a medias).
- Un traspaso `COMPLETADO` no se puede editar ni eliminar: primero hay que cancelarlo con **Cancelar y devolver stock**. Lo mismo aplica a una salida `ENTREGADA`.
- Un traspaso solo se edita mientras está `PENDIENTE` o `PROCESADO`.
- La pantalla envía el estado deseado; el servidor rechaza cualquier valor fuera de la lista con `400`.

## Almacenes

Además del nombre, la dirección, el teléfono, la zona y el estado (`ACTIVO` / `INACTIVO`), un almacén tiene tipo, cuenta de inventario, centro de costos y técnico responsable; el **almacén principal** es el destino por defecto de las compras y no se puede eliminar.

Al pulsar **Eliminar** (`DELETE /api/almacenes/:id`):

- Si tiene ingresos, salidas, traspasos o filas de inventario registrados, **no se borra**: queda como `INACTIVO` y el servidor responde `desactivado: true` con un mensaje explicándolo. Así se conserva el historial.
- Si no tiene historial y su stock es `0`, se elimina definitivamente junto con sus filas de inventario.
- El almacén principal y uno con stock mayor que `0` no se pueden eliminar (responde `400`).

Desde la pantalla se puede cambiar el estado manualmente para dejar un almacén fuera de las listas sin perder sus datos. Los almacenes `INACTIVO` dejan de aparecer como origen y destino en traspasos y salidas.

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

Las migraciones están en `database/migrations/` y se aplican en orden numérico. Con una base nueva, Docker carga `007_productos_update.sql` y después `008_rol_almacen.sql`, `009_clientes.sql`, `010_rol_atencion_cliente.sql`, `011_roles_tres_almacen.sql` y `012_traspaso_auditoria.sql` automáticamente.

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

### La segunda base (técnicos, OLTS y contratos)

El backend abre dos conexiones: `pool` (Keeper) y `poolExterna`, que lee los técnicos que pueden recibir un almacén, los OLTS y los contratos internos que aparecen en el formulario de salidas. Las tablas que usa son `personal`, `olt`, `contratos` y `clientes`, siempre de solo lectura.

Para no depender de una red interna, `database/externa/empresa_externa.sql` crea esa segunda base **dentro del mismo contenedor MariaDB**: su propio esquema `empresa_externa`, esas cuatro tablas, datos de ejemplo y un usuario `externa_user` que solo tiene `SELECT` sobre ese esquema. Docker lo carga solo en una base nueva (está montado como `07_empresa_externa.sql`); en un volumen existente se aplica una vez:

```bash
docker exec -i keeper-db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"' < database/externa/empresa_externa.sql
```

Con eso, en `.env` basta `DB_EXTERNA_HOST=mariadb`, `DB_EXTERNA_NAME=empresa_externa`, `DB_EXTERNA_USER=externa_user` y `DB_EXTERNA_PASSWORD=externa123` (esa contraseña la fija el propio script y es solo para desarrollo local). El script es idempotente: repetirlo lo deja igual.

Para conectar una base externa de verdad, cambia solo `DB_EXTERNA_*` en `.env` y reinicia el backend (`docker compose up -d backend`). Fíjate en dos filtros que dependen de los datos de cada empresa: `CARGO IN ('SOPORTE TECNICO','INSTALADOR','REDES')` en `backend/src/controllers/almacenController.js` y `codigo LIKE 'ATT-%'` en `backend/src/controllers/salidasController.js`. Si la base externa no está a mano, esas pantallas siguen funcionando con sus datos locales: los combos salen vacíos y el log del backend avisa `Base externa no disponible`.

### Ver los datos en un navegador de base de datos

**DB Browser for SQLite** solo abre archivos `.sqlite`, no se conecta a MariaDB. Para poder recorrerlo ahí, `backend/scripts/export-sqlite.mjs` le vuelca las tablas (Node 22.5 o superior; en Node 24 muestra un aviso de "experimental" y nada más):

```bash
node backend/scripts/export-sqlite.mjs           # keeper -> database/export/keeper.sqlite
node backend/scripts/export-sqlite.mjs externa   # empresa_externa -> database/export/empresa_externa.sqlite
```

Lee las credenciales del `.env` de la raíz, se conecta a `127.0.0.1:3310` (el puerto que publica el contenedor) y crea cada tabla con sus datos. Acepta `--host=`, `--port=` y `--salida=` para apuntar a otro sitio.

- El `.sqlite` es una **foto fija**: registra algo en la página, relanza el script y vuelve a abrir el archivo para verlo. Los cambios que hagas en el archivo **no** regresan a MariaDB.
- El relanzado reescribe las tablas dentro del mismo archivo (no lo borra), así que suele funcionar con DB Browser abierto; solo tienes que cerrar la base y volverla a abrir para ver los datos nuevos. Si el programa tiene el archivo bloqueado, el script lo dice y basta con `Archivo > Cerrar base de datos`.
- `database/export/` está fuera de git porque el volcado incluye `password_hash` de `usuario` y las `sessions` activas.
- Para leer y escribir directamente sobre la base, usa un cliente de MariaDB (HeidiSQL, DBeaver, MySQL Workbench): host `127.0.0.1`, puerto `3310`, usuario `keeper_user` y la contraseña `DB_PASSWORD` del `.env`; la segunda base entra con `externa_user` / `DB_EXTERNA_PASSWORD` sobre el esquema `empresa_externa`.

## Desarrollo sin Docker

```bash
# Backend (puerto 3000 por defecto)
cd backend && npm install && npm start

# Frontend (puerto 5173)
cd frontend && npm install && npm run dev
```

Necesitas una instancia de MariaDB con la base cargada y las variables de entorno configuradas.

## Seguridad

- El `.env` está fuera del repositorio (ver `.gitignore`); la plantilla es `.env.example`. Aun así, los commits hasta `2174872` lo incluyeron, así que las credenciales que estaban ahí —la contraseña de la red interna en `DB_OPTIMUS_PASSWORD` y las de `keeper_user`/root— siguen visibles en el historial y hay que rotarlas. Borrarlas del historial requiere reescribirlo (`git filter-repo`) y un force-push coordinado.
- Cambia las credenciales por defecto en producción.
- Mantén `VITE_API_URL` apuntando al backend correcto en cada entorno.
