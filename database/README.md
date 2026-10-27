# Database Documentation

Este directorio contiene la estructura de la base de datos del proyecto Keeper.

## Estructura

### `/schemas`
Contiene los esquemas principales de la base de datos:
- `keeper.sql`: Esquema completo actual de la base de datos

### `/migrations`
Contiene las migraciones de base de datos organizadas secuencialmente:
- `001_proveedores_update.sql`: Actualización de la tabla proveedores
- `007_productos_update.sql`: Esquema completo más reciente (base de inicialización)
- `008_rol_almacen.sql`: Agrega el rol `ALMACEN` a la restricción `chk_usuario_rol` de la tabla `usuario`
- `009_clientes.sql`: Crea la tabla `cliente_internet` (gestión de clientes: contrato, CI, celular, zona, plan y estado). No modifica la tabla `cliente` original
- `010_rol_atencion_cliente.sql`: Quita el rol `SUPERVISOR` (sus usuarios pasan a `SOLO_LECTURA`) y agrega `ATENCION_CLIENTE` a la restricción `chk_usuario_rol`
- `011_roles_tres_almacen.sql`: Quita los roles `USUARIO` y `SOLO_LECTURA` (sus usuarios pasan a `ALMACEN` y quedan `INACTIVO`); la restricción `chk_usuario_rol` queda en `ADMIN`, `ALMACEN` y `ATENCION_CLIENTE`, y el valor por defecto de la columna `rol` pasa a `ALMACEN`
- `012_traspaso_auditoria.sql`: Agrega a la tabla `traspaso` las columnas `updated_at` y `updated_by` (con su clave foránea a `usuario`), que son las que usan `PUT /api/traspasos/:id` y `PATCH /api/traspasos/:id/estado`

### `/externa`
- `empresa_externa.sql`: Segunda base de datos a la que se conecta el backend (`poolExterna`), simulada dentro del mismo contenedor MariaDB. Crea el esquema `empresa_externa` con las tablas de solo lectura `personal`, `olt`, `contratos` y `clientes`, datos de ejemplo y el usuario `externa_user` (solo `SELECT` sobre ese esquema). Es idempotente y se monta como `07_empresa_externa.sql` en `docker-entrypoint-initdb.d`.



## Uso

### Inicialización de la Base de Datos
El archivo principal para inicializar la base de datos es:
```
./database/migrations/007_productos_update.sql
```

Este archivo se monta en el contenedor Docker para inicializar la base de datos y contiene el esquema más reciente con todas las actualizaciones. Después se cargan, en ese orden, `008_rol_almacen.sql`, `009_clientes.sql`, `010_rol_atencion_cliente.sql`, `011_roles_tres_almacen.sql` y `012_traspaso_auditoria.sql` (los nombres dentro de `docker-entrypoint-initdb.d` llevan prefijo numérico para garantizar la secuencia).

Los cambios de esquema que ya están codificados en `backend/src/config/ensureSchema.js` (`010`, `011` y `012`) se aplican solos cada vez que arranca el backend, así que una base creada antes de estas migraciones se pone al día sin intervención manual. `externa/empresa_externa.sql` no puede estar ahí: crea usuario y privilegios, y eso necesita root dentro del contenedor.

### Aplicar Migraciones
Las migraciones en `/migrations` deben aplicarse en orden secuencial según su numeración.

## Mantenimiento

- Siempre crear nuevas migraciones en `/migrations` con numeración secuencial
- Actualizar el esquema principal en `/schemas` después de aplicar migraciones
- Documentar todos los cambios en este archivo README