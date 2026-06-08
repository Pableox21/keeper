# Database Documentation

Este directorio contiene la estructura de la base de datos del proyecto Keeper.

## Estructura

### `/schemas`
Contiene los esquemas principales de la base de datos:
- `keeper.sql`: Esquema completo actual de la base de datos

### `/migrations`
Contiene las migraciones de base de datos organizadas secuencialmente:
- `001_proveedores_update.sql`: Actualización de la tabla proveedores



## Uso

### Inicialización de la Base de Datos
El archivo principal para inicializar la base de datos es:
```
./database/migrations/001_proveedores_update.sql
```

Este archivo se monta en el contenedor Docker para inicializar la base de datos y contiene el esquema más reciente con todas las actualizaciones.

### Aplicar Migraciones
Las migraciones en `/migrations` deben aplicarse en orden secuencial según su numeración.

## Mantenimiento

- Siempre crear nuevas migraciones en `/migrations` con numeración secuencial
- Actualizar el esquema principal en `/schemas` después de aplicar migraciones
- Documentar todos los cambios en este archivo README