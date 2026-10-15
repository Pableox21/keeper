-- Módulo de gestión de clientes del servicio de internet.
-- IMPORTANTE: el esquema ya tiene una tabla `cliente` (con otras columnas y usada por una llave foránea),
-- por eso este módulo usa una tabla nueva llamada `cliente_internet` y no modifica la existente.
-- Ejecutar UNA vez sobre la base existente (ver instrucciones en el README).
USE `keeper`;

CREATE TABLE IF NOT EXISTS `cliente_internet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_contrato` varchar(30) NOT NULL,
  `nombre_completo` varchar(255) NOT NULL,
  `ci` varchar(10) NOT NULL,
  `ci_complemento` varchar(3) DEFAULT NULL,
  `celular` varchar(8) NOT NULL,
  `zona` varchar(20) NOT NULL,
  `plan` varchar(20) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'ACTIVO',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cliente_internet_contrato` (`numero_contrato`),
  KEY `idx_cliente_internet_ci` (`ci`),
  KEY `idx_cliente_internet_zona` (`zona`),
  KEY `idx_cliente_internet_plan` (`plan`),
  KEY `idx_cliente_internet_estado` (`estado`),
  CONSTRAINT `chk_cliente_internet_zona` CHECK (`zona` in ('SIPE_SIPE','SUTICOLLO','MALLCO_CHAPI')),
  CONSTRAINT `chk_cliente_internet_plan` CHECK (`plan` in ('ECONOMICO','MEDIO','PREMIUM','GAMER')),
  CONSTRAINT `chk_cliente_internet_estado` CHECK (`estado` in ('ACTIVO','INACTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
