
-- Volcando estructura para tabla keeper.departamento
CREATE TABLE IF NOT EXISTS `departamento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.departamento
INSERT INTO `departamento` (`codigo`, `nombre`) VALUES
  ('AMPLIACION_NODO', 'Ampliación de Nodo'),
  ('AMPLIACION_RED', 'Ampliación de Red'),
  ('CONSTRUCCION_NODO', 'Construcción de Nodo'),
  ('CONSTRUCCION_RED', 'Construcción de Red'),
  ('INTALACION_CLIENTE', 'Instalación Cliente'),
  ('MANTENIMIENTO_CLIENTE', 'Mantenimiento Cliente'),
  ('MANTENIMIENTO_NODO', 'Mantenimiento Nodo'),
  ('MANTENIMIENTO_RED', 'Mantenimiento Red'),
  ('PUBLICIDAD_RED', 'Publicidad Red');
-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         11.8.3-MariaDB-ubu2404 - mariadb.org binary distribution
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:             12.5.0.6677
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para keeper
CREATE DATABASE IF NOT EXISTS `keeper` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `keeper`;

-- Volcando estructura para tabla keeper.almacen
CREATE TABLE IF NOT EXISTS `almacen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `direccion` varchar(500) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `zona` varchar(100) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'ACTIVO',
  `es_principal` tinyint(1) DEFAULT 0,
  `es_tecnico` tinyint(1) DEFAULT 0,
  `capacidad` int(11) DEFAULT NULL,
  `id_cuenta_contable` int(11) DEFAULT NULL,
  `id_tipo` int(11) NOT NULL,
  `id_responsable` int(11) DEFAULT NULL,
  `id_centro_costo` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `id_tecnico_optiweb` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_almacen_codigo` (`codigo`),
  KEY `idx_almacen_estado` (`estado`),
  KEY `idx_almacen_responsable` (`id_responsable`),
  KEY `idx_almacen_tecnico` (`es_tecnico`),
  KEY `fk_almacen_tipo` (`id_tipo`),
  KEY `fk_almacen_centro_costo` (`id_centro_costo`),
  KEY `fk_almacen_cuenta_contable` (`id_cuenta_contable`),
  KEY `fk_almacen_created_by` (`created_by`),
  KEY `fk_almacen_updated_by` (`updated_by`),
  CONSTRAINT `fk_almacen_centro_costo` FOREIGN KEY (`id_centro_costo`) REFERENCES `centro_costo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_almacen_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_almacen_cuenta_contable` FOREIGN KEY (`id_cuenta_contable`) REFERENCES `cuenta_inventario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_almacen_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_almacen_tipo` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_almacen_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_almacen_estado` CHECK (`estado` in ('ACTIVO','INACTIVO','MANTENIMIENTO')),
  CONSTRAINT `chk_almacen_capacidad` CHECK (`capacidad` is null or `capacidad` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.almacen: ~3 rows (aproximadamente)
INSERT INTO `almacen` (`id`, `codigo`, `nombre`, `direccion`, `telefono`, `observacion`, `zona`, `estado`, `es_principal`, `es_tecnico`, `capacidad`, `id_cuenta_contable`, `id_tipo`, `id_responsable`, `id_centro_costo`, `created_at`, `updated_at`, `created_by`, `updated_by`, `id_tecnico_optiweb`) VALUES
	(1, 'ALM-PRINCIPAL', 'ALMACEN CENTRAL', 'Casa Matriz - Zona Centra SACABAl', '4444444', 'Almacén principal de la empresa oP', 'CENTRAL', 'ACTIVO', 1, 0, 5000, 1, 1, 3, NULL, '2025-09-30 18:40:48', '2025-10-01 12:44:39', 3, NULL, NULL),
	(2, 'ALM-TEC-01', 'ALMACEN TECNICO ZONA SUR - ACTUALIZADO', 'Zona Sur, Av. Principal #123', '5555555', 'Almacén para técnicos de la zona sur - Capacidad aumentada', 'SUR', 'ACTIVO', 0, 1, 1500, 1, 3, 3, NULL, '2025-09-30 18:50:07', '2025-10-03 14:59:48', 3, 2, NULL),
	(3, 'ALM-TEC002', 'ALMACEN TEC 2', 'Casa Matriz - Zona Central', '4444444', 'Almacén TECNICO de la empresa', 'CENTRAL', 'ACTIVO', 0, 1, 5000, 1, 3, 3, NULL, '2025-10-03 14:21:46', '2025-10-03 14:21:46', 2, NULL, 9);

-- Volcando estructura para tabla keeper.categoria
CREATE TABLE IF NOT EXISTS `categoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.categoria: ~5 rows (aproximadamente)
INSERT INTO `categoria` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
	(1, 'OFICINA', 'Materiales de oficina y administrativos', '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(2, 'TECNOLOGÍA', 'Equipos y materiales tecnológicos', '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(3, 'LIMPIEZA', 'Productos de limpieza y mantenimiento', '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(4, 'SEGURIDAD', 'Equipos de seguridad personal', '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(5, 'VARIOS', 'Materiales varios no clasificados', '2025-09-24 19:23:22', '2025-09-24 19:23:22');

-- Volcando estructura para tabla keeper.centro_costo
CREATE TABLE IF NOT EXISTS `centro_costo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.centro_costo: ~4 rows (aproximadamente)
INSERT INTO `centro_costo` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'CC001', 'Administración', 'Centro de costo administrativo', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(2, 'CC002', 'Ventas', 'Centro de costo de ventas', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(3, 'CC003', 'Producción', 'Centro de costo de producción', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(4, 'CC004', 'Técnico', 'Centro de costo técnico', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22');

-- Volcando estructura para tabla keeper.cliente
CREATE TABLE IF NOT EXISTS `cliente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `direccion` varchar(500) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `zona` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `nit` (`nit`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.cliente: ~0 rows (aproximadamente)
INSERT INTO `cliente` (`id`, `codigo`, `nombre`, `nit`, `direccion`, `telefono`, `email`, `ciudad`, `zona`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'CLI001', 'Cliente General', '00000000-0', 'Sin dirección específica', '00000000', NULL, NULL, NULL, 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22');

-- Volcando estructura para tabla keeper.cuenta_inventario
CREATE TABLE IF NOT EXISTS `cuenta_inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `tipo_cuenta` varchar(20) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_cuenta_tipo` (`tipo_cuenta`),
  KEY `idx_cuenta_codigo` (`codigo`),
  KEY `idx_cuenta_activo` (`activo`),
  CONSTRAINT `chk_cuenta_tipo` CHECK (`tipo_cuenta` in ('INGRESO','COSTO','INVENTARIO','AJUSTE'))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.cuenta_inventario: ~4 rows (aproximadamente)
INSERT INTO `cuenta_inventario` (`id`, `codigo`, `nombre`, `tipo_cuenta`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
	(1, '1410', 'Inventario de Productos', 'INVENTARIO', 'Cuenta de inventario de productos', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(2, '5110', 'Costo de Productos', 'COSTO', 'Cuenta de costo de productos vendidos', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(3, '4110', 'Ventas de Productos', 'INGRESO', 'Cuenta de ingresos por ventas', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(4, '5120', 'Ajustes de Inventario', 'AJUSTE', 'Cuenta para ajustes de inventario', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22');

-- Volcando estructura para tabla keeper.empresa
CREATE TABLE IF NOT EXISTS `empresa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.empresa: ~0 rows (aproximadamente)
INSERT INTO `empresa` (`id`, `nombre`, `created_at`, `updated_at`) VALUES
	(1, 'MI EMPRESA S.A.', '2025-09-24 19:23:22', '2025-09-24 19:23:22');

-- Volcando estructura para tabla keeper.ingreso
CREATE TABLE IF NOT EXISTS `ingreso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_proveedor` int(11) NOT NULL,
  `id_almacen` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `id_tipo_ingreso` int(11) NOT NULL,
  `doc_respaldo` varchar(100) NOT NULL,
  `numero_doc` varchar(100) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `detalle` text DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `forma_pago` enum('EFECTIVO','QR','TRANSFERENCIA') DEFAULT NULL,
  `total` decimal(12,2) DEFAULT 0.00,
  `id_responsable` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_ingreso_codigo` (`codigo`),
  KEY `idx_ingreso_fecha` (`fecha`),
  KEY `idx_ingreso_proveedor` (`id_proveedor`),
  KEY `idx_ingreso_almacen` (`id_almacen`),
  KEY `idx_ingreso_estado` (`estado`),
  KEY `idx_ingreso_numero_doc` (`numero_doc`),
  KEY `fk_ingreso_tipo` (`id_tipo_ingreso`),
  KEY `fk_ingreso_responsable` (`id_responsable`),
  KEY `fk_ingreso_created_by` (`created_by`),
  KEY `fk_ingreso_updated_by` (`updated_by`),
  CONSTRAINT `fk_ingreso_almacen` FOREIGN KEY (`id_almacen`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_tipo` FOREIGN KEY (`id_tipo_ingreso`) REFERENCES `tipo_ingreso` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_ingreso_estado` CHECK (`estado` in ('PENDIENTE','RECIBIDO','PROCESADO','CANCELADO')),
  CONSTRAINT `chk_ingreso_total` CHECK (`total` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.ingreso: ~0 rows (aproximadamente)
INSERT INTO `ingreso` (`id`, `id_proveedor`, `id_almacen`, `fecha`, `hora`, `id_tipo_ingreso`, `doc_respaldo`, `numero_doc`, `codigo`, `detalle`, `estado`, `forma_pago`, `total`, `id_responsable`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
	(1, 1, 1, '2024-01-15', '15:45:00', 1, 'FACTURA', 'F-001-001-2025', 'ING-0001', 'Compra de 15 bobinas de cable drop - ACTUALIZADO', 'PENDIENTE', NULL, 7500.00, 3, '2025-09-30 20:02:15', '2025-10-01 12:44:21', 3, 3);

-- Volcando estructura para tabla keeper.ingreso_detalle
CREATE TABLE IF NOT EXISTS `ingreso_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ingreso` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ingreso_producto` (`id_ingreso`,`id_producto`),
  KEY `fk_ingreso_det_producto` (`id_producto`),
  CONSTRAINT `fk_ingreso_det_ingreso` FOREIGN KEY (`id_ingreso`) REFERENCES `ingreso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_det_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `chk_ingreso_det_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_ingreso_det_precio` CHECK (`precio_unitario` > 0),
  CONSTRAINT `chk_ingreso_det_subtotal` CHECK (`subtotal` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.ingreso_detalle: ~0 rows (aproximadamente)
INSERT INTO `ingreso_detalle` (`id`, `id_ingreso`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
	(2, 1, 1, 15, 500.00, 7500.00);

-- Volcando estructura para tabla keeper.ingreso_produccion
CREATE TABLE IF NOT EXISTS `ingreso_produccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `fecha` date NOT NULL,
  `detalle` text DEFAULT NULL,
  `id_almacen` int(11) NOT NULL,
  `id_orden_trabajo` int(11) DEFAULT NULL,
  `id_centro_costo` int(11) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_ingreso_prod_codigo` (`codigo`),
  KEY `idx_ingreso_prod_fecha` (`fecha`),
  KEY `idx_ingreso_prod_almacen` (`id_almacen`),
  KEY `idx_ingreso_prod_orden` (`id_orden_trabajo`),
  KEY `fk_ingreso_prod_centro_costo` (`id_centro_costo`),
  KEY `fk_ingreso_prod_created_by` (`created_by`),
  KEY `fk_ingreso_prod_updated_by` (`updated_by`),
  CONSTRAINT `fk_ingreso_prod_almacen` FOREIGN KEY (`id_almacen`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_prod_centro_costo` FOREIGN KEY (`id_centro_costo`) REFERENCES `centro_costo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_prod_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_prod_orden` FOREIGN KEY (`id_orden_trabajo`) REFERENCES `orden_trabajo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_prod_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_ingreso_prod_estado` CHECK (`estado` in ('PENDIENTE','RECIBIDO','PROCESADO','RECHAZADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.ingreso_produccion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.ingreso_produccion_detalle
CREATE TABLE IF NOT EXISTS `ingreso_produccion_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_ingreso_produccion` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `estado_material` varchar(20) DEFAULT 'BUENO',
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ingreso_prod_producto` (`id_ingreso_produccion`,`id_producto`),
  KEY `fk_ingreso_prod_det_producto` (`id_producto`),
  CONSTRAINT `fk_ingreso_prod_det_ingreso` FOREIGN KEY (`id_ingreso_produccion`) REFERENCES `ingreso_produccion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ingreso_prod_det_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `chk_ingreso_prod_det_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_ingreso_prod_det_estado` CHECK (`estado_material` in ('BUENO','DAÑADO','OBSOLETO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.ingreso_produccion_detalle: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.inventario
CREATE TABLE IF NOT EXISTS `inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_almacen` int(11) NOT NULL,
  `stock_actual` int(11) NOT NULL DEFAULT 0,
  `costo_promedio` decimal(12,2) DEFAULT 0.00,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventario_producto_almacen` (`id_producto`,`id_almacen`),
  KEY `idx_inventario_producto` (`id_producto`),
  KEY `idx_inventario_almacen` (`id_almacen`),
  KEY `idx_inventario_stock_bajo` (`id_producto`,`id_almacen`),
  CONSTRAINT `fk_inventario_almacen` FOREIGN KEY (`id_almacen`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `chk_inventario_costo` CHECK (`costo_promedio` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.inventario: ~0 rows (aproximadamente)
INSERT INTO `inventario` (`id`, `id_producto`, `id_almacen`, `stock_actual`, `costo_promedio`, `updated_at`) VALUES
	(2, 1, 1, 13, 500.00, '2025-10-03 15:06:38'),
	(3, 1, 3, 2, 500.00, '2025-10-03 15:06:38');

-- Volcando estructura para tabla keeper.linea
CREATE TABLE IF NOT EXISTS `linea` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.linea: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.marca
CREATE TABLE IF NOT EXISTS `marca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.marca: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.orden_trabajo
CREATE TABLE IF NOT EXISTS `orden_trabajo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_doc` varchar(100) NOT NULL,
  `fecha` date NOT NULL,
  `fecha_entrega` date DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `id_cliente` int(11) NOT NULL,
  `id_responsable` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_doc` (`numero_doc`),
  KEY `idx_orden_numero_doc` (`numero_doc`),
  KEY `idx_orden_fecha` (`fecha`),
  KEY `idx_orden_cliente` (`id_cliente`),
  KEY `idx_orden_estado` (`estado`),
  KEY `fk_orden_responsable` (`id_responsable`),
  KEY `fk_orden_created_by` (`created_by`),
  KEY `fk_orden_updated_by` (`updated_by`),
  CONSTRAINT `fk_orden_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_orden_estado` CHECK (`estado` in ('PENDIENTE','EN_PROCESO','COMPLETADA','CANCELADA')),
  CONSTRAINT `chk_orden_fechas` CHECK (`fecha_entrega` is null or `fecha_entrega` >= `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.orden_trabajo: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.producto
CREATE TABLE IF NOT EXISTS `producto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `prefijo` varchar(10) DEFAULT NULL,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `codigo_fabrica` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `principio_activo` varchar(255) DEFAULT NULL,
  `unidad_ingreso` varchar(50) NOT NULL,
  `unidad_distribucion` varchar(50) DEFAULT NULL,
  `unidad_uso` varchar(50) DEFAULT NULL,
  `factor_uso` decimal(10,3) DEFAULT NULL,
  `merma` decimal(5,2) DEFAULT NULL,
  `unidad_venta` varchar(50) DEFAULT NULL,
  `stock_distribucion` int(11) DEFAULT 0,
  `stock_unitario` int(11) DEFAULT 0,
  `stock_mermas` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 0,
  `stock_maximo` int(11) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'ACTIVO',
  `especificaciones` text DEFAULT NULL,
  `precio_venta` decimal(12,2) DEFAULT 0.00,
  `id_cuenta_ingreso` int(11) DEFAULT NULL,
  `id_cuenta_costo` int(11) DEFAULT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `id_empresa` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_linea` int(11) DEFAULT NULL,
  `id_marca` int(11) DEFAULT NULL,
  `id_unidad_medida` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_producto_codigo` (`codigo`),
  KEY `idx_producto_nombre` (`nombre`),
  KEY `idx_producto_estado` (`estado`),
  KEY `idx_producto_empresa` (`id_empresa`),
  KEY `idx_producto_categoria` (`id_categoria`),
  KEY `idx_producto_codigo_barras` (`codigo_barras`),
  KEY `idx_producto_unidad` (`id_unidad_medida`),
  KEY `idx_producto_prefijo` (`prefijo`),
  KEY `fk_producto_linea` (`id_linea`),
  KEY `fk_producto_marca` (`id_marca`),
  KEY `fk_producto_cuenta_ingreso` (`id_cuenta_ingreso`),
  KEY `fk_producto_cuenta_costo` (`id_cuenta_costo`),
  KEY `fk_producto_created_by` (`created_by`),
  KEY `fk_producto_updated_by` (`updated_by`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_cuenta_costo` FOREIGN KEY (`id_cuenta_costo`) REFERENCES `cuenta_inventario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_cuenta_ingreso` FOREIGN KEY (`id_cuenta_ingreso`) REFERENCES `cuenta_inventario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_linea` FOREIGN KEY (`id_linea`) REFERENCES `linea` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_marca` FOREIGN KEY (`id_marca`) REFERENCES `marca` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_unidad_medida` FOREIGN KEY (`id_unidad_medida`) REFERENCES `unidad_medida` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_producto_precio_venta` CHECK (`precio_venta` >= 0),
  CONSTRAINT `chk_producto_stock_minimo` CHECK (`stock_minimo` >= 0),
  CONSTRAINT `chk_producto_stock_maximo` CHECK (`stock_maximo` is null or `stock_maximo` >= `stock_minimo`),
  CONSTRAINT `chk_producto_estado` CHECK (`estado` in ('ACTIVO','INACTIVO','DESCONTINUADO')),
  CONSTRAINT `chk_producto_stocks` CHECK (`stock_distribucion` >= 0 and `stock_unitario` >= 0 and `stock_mermas` >= 0),
  CONSTRAINT `chk_producto_factor_uso` CHECK (`factor_uso` is null or `factor_uso` > 0),
  CONSTRAINT `chk_producto_merma` CHECK (`merma` is null or `merma` >= 0 and `merma` <= 100)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.producto: ~0 rows (aproximadamente)
INSERT INTO `producto` (`id`, `codigo`, `nombre`, `descripcion`, `prefijo`, `codigo_barras`, `codigo_fabrica`, `ubicacion`, `principio_activo`, `unidad_ingreso`, `unidad_distribucion`, `unidad_uso`, `factor_uso`, `merma`, `unidad_venta`, `stock_distribucion`, `stock_unitario`, `stock_mermas`, `stock_minimo`, `stock_maximo`, `estado`, `especificaciones`, `precio_venta`, `id_cuenta_ingreso`, `id_cuenta_costo`, `imagen`, `observaciones`, `id_empresa`, `id_categoria`, `id_linea`, `id_marca`, `id_unidad_medida`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
	(1, 'CD1HR', 'CABLE DROP 1 HILO REFORZADO', NULL, NULL, NULL, NULL, NULL, NULL, 'bob', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 10, 5000, 'ACTIVO', NULL, 1000.00, NULL, NULL, NULL, NULL, 1, 1, NULL, NULL, 1, '2025-09-30 19:46:41', '2025-09-30 19:46:41', NULL, NULL);

-- Volcando estructura para tabla keeper.proveedor
CREATE TABLE IF NOT EXISTS `proveedor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cod` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `direccion` varchar(500) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `zona` varchar(100) DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `autorizado` tinyint(1) DEFAULT 1,
  `id_tipodoc` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cod` (`cod`),
  UNIQUE KEY `nit` (`nit`),
  KEY `idx_proveedor_cod` (`cod`),
  KEY `idx_proveedor_nit` (`nit`),
  KEY `idx_proveedor_nombre` (`nombre`),
  KEY `fk_proveedor_tipo_doc` (`id_tipodoc`),
  KEY `fk_proveedor_created_by` (`created_by`),
  KEY `fk_proveedor_updated_by` (`updated_by`),
  CONSTRAINT `fk_proveedor_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proveedor_tipo_doc` FOREIGN KEY (`id_tipodoc`) REFERENCES `tipo_doc` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proveedor_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.proveedor: ~2 rows (aproximadamente)
INSERT INTO `proveedor` (`id`, `cod`, `nombre`, `nit`, `direccion`, `ciudad`, `zona`, `comentario`, `autorizado`, `id_tipodoc`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
	(1, 'PROV-001', 'Nuevo Nombrejiji', '12345678', 'Calle Falsa 123', 'La Paz', 'Peñas', 'Notas', 0, NULL, '2025-09-26 19:31:56', '2025-09-26 19:34:36', 3, 3),
	(2, 'PROV-002', 'Proveedor Ejemplo SRL', '123456as78', 'Calle Falsa 123', 'La Paz', 'Peñas', 'Notas', 1, 1, '2025-09-26 19:50:27', '2025-09-26 19:50:27', 3, NULL);

-- Volcando estructura para tabla keeper.proveedor_email
CREATE TABLE IF NOT EXISTS `proveedor_email` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_proveedor` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `tipo` varchar(20) DEFAULT 'COMERCIAL',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proveedor_email` (`id_proveedor`,`email`),
  CONSTRAINT `fk_prov_email_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_proveedor_email_tipo` CHECK (`tipo` in ('COMERCIAL','FACTURACION','SOPORTE'))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.proveedor_email: ~2 rows (aproximadamente)
INSERT INTO `proveedor_email` (`id`, `id_proveedor`, `email`, `tipo`) VALUES
	(1, 1, 'ventas@ejemplo.com', 'COMERCIAL'),
	(2, 2, 'ventas@ejemplo.com', 'COMERCIAL');

-- Volcando estructura para tabla keeper.proveedor_telefono
CREATE TABLE IF NOT EXISTS `proveedor_telefono` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_proveedor` int(11) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `tipo` varchar(20) DEFAULT 'PRINCIPAL',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proveedor_telefono` (`id_proveedor`,`telefono`),
  CONSTRAINT `fk_prov_tel_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_proveedor_tel_tipo` CHECK (`tipo` in ('PRINCIPAL','SECUNDARIO','FAX'))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.proveedor_telefono: ~2 rows (aproximadamente)
INSERT INTO `proveedor_telefono` (`id`, `id_proveedor`, `telefono`, `tipo`) VALUES
	(1, 1, '76543210', 'PRINCIPAL'),
	(2, 2, '76543210', 'PRINCIPAL');

-- Volcando estructura para tabla keeper.salida
CREATE TABLE IF NOT EXISTS `salida` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `fecha` date NOT NULL,
  `id_responsable` int(11) NOT NULL,
  `id_almacen` int(11) NOT NULL,
  `id_tipo_salida` int(11) NOT NULL,
  `id_orden_trabajo` int(11) DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `destino` varchar(255) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_salida_codigo` (`codigo`),
  KEY `idx_salida_fecha` (`fecha`),
  KEY `idx_salida_estado` (`estado`),
  KEY `idx_salida_responsable` (`id_responsable`),
  KEY `idx_salida_almacen` (`id_almacen`),
  KEY `idx_salida_orden_trabajo` (`id_orden_trabajo`),
  KEY `fk_salida_tipo` (`id_tipo_salida`),
  KEY `fk_salida_created_by` (`created_by`),
  KEY `fk_salida_updated_by` (`updated_by`),
  CONSTRAINT `fk_salida_almacen` FOREIGN KEY (`id_almacen`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_orden_trabajo` FOREIGN KEY (`id_orden_trabajo`) REFERENCES `orden_trabajo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_tipo` FOREIGN KEY (`id_tipo_salida`) REFERENCES `tipo_salida` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_salida_estado` CHECK (`estado` in ('PENDIENTE','ENTREGADA','CANCELADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.salida: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.salida_detalle
CREATE TABLE IF NOT EXISTS `salida_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_salida` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(12,2) DEFAULT 0.00,
  `lote` varchar(50) DEFAULT NULL,
  `serie` varchar(100) DEFAULT NULL,
  `estado_material` varchar(20) DEFAULT 'NUEVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_salida_producto_lote_serie` (`id_salida`,`id_producto`,`lote`,`serie`),
  KEY `fk_salida_det_producto` (`id_producto`),
  CONSTRAINT `fk_salida_det_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_salida_det_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_salida_det_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_salida_det_precio` CHECK (`precio_unitario` >= 0),
  CONSTRAINT `chk_salida_det_estado` CHECK (`estado_material` in ('NUEVO','USADO','REACONDICIONADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.salida_detalle: ~0 rows (aproximadamente)

-- Volcando estructura para tabla keeper.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_token` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla keeper.sessions: ~5 rows (aproximadamente)
INSERT INTO `sessions` (`id`, `session_token`, `user_id`, `ip`, `user_agent`, `created_at`, `last_activity`, `expires_at`) VALUES
	(1, 'ae363b91-c0a7-409c-9158-39df26a6186f', 3, '::ffff:172.18.0.1', 'PostmanRuntime/7.47.1', '2025-09-26 16:02:54', '2025-09-26 16:02:54', '2025-09-26 19:02:54'),
	(2, 'a2fd1991-4a2e-449f-b0b0-d0051c9b1ba9', 3, '::ffff:172.18.0.1', 'PostmanRuntime/7.47.1', '2025-09-26 19:19:49', '2025-09-26 19:50:27', '2025-09-26 22:19:49'),
	(3, 'a5ead35d-afc1-470f-9e33-428d7622e0f7', 3, '::ffff:172.18.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-30 15:34:33', '2025-09-30 15:34:33', '2025-09-30 18:34:33'),
	(4, 'c73523e0-cc94-455b-b653-ead34acae241', 3, '::ffff:172.18.0.1', 'PostmanRuntime/7.48.0', '2025-09-30 18:38:23', '2025-09-30 20:25:48', '2025-09-30 21:38:23'),
	(5, 'ac082dee-bbaf-4b2b-a20c-1b3fe368c960', 2, '::ffff:172.18.0.1', 'PostmanRuntime/7.48.0', '2025-10-03 14:19:13', '2025-10-03 15:06:38', '2025-10-03 17:19:13');

-- Volcando estructura para tabla keeper.tipo_almacen
CREATE TABLE IF NOT EXISTS `tipo_almacen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.tipo_almacen: ~5 rows (aproximadamente)
INSERT INTO `tipo_almacen` (`id`, `nombre`, `descripcion`) VALUES
	(1, 'PRINCIPAL', 'Almacén principal de la empresa'),
	(2, 'SUCURSAL', 'Almacén de sucursal o sede'),
	(3, 'TECNICO', 'Almacén asignado a técnico de campo'),
	(4, 'TEMPORAL', 'Almacén temporal para eventos'),
	(5, 'TRÁNSITO', 'Almacén de mercadería en tránsito');

-- Volcando estructura para tabla keeper.tipo_doc
CREATE TABLE IF NOT EXISTS `tipo_doc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.tipo_doc: ~4 rows (aproximadamente)
INSERT INTO `tipo_doc` (`id`, `nombre`, `descripcion`) VALUES
	(1, 'NIT', 'Número de Identificación Tributaria'),
	(2, 'CI', 'Cédula de Identidad'),
	(3, 'PASAPORTE', 'Documento de Pasaporte'),
	(4, 'RUC', 'Registro Único de Contribuyente');

-- Volcando estructura para tabla keeper.tipo_ingreso
CREATE TABLE IF NOT EXISTS `tipo_ingreso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.tipo_ingreso: ~4 rows (aproximadamente)
INSERT INTO `tipo_ingreso` (`id`, `nombre`, `descripcion`) VALUES
	(1, 'COMPRA', 'Ingreso por compra a proveedor'),
	(2, 'DEVOLUCION', 'Ingreso por devolución'),
	(3, 'AJUSTE', 'Ingreso por ajuste de inventario'),
	(4, 'TRASPASO', 'Ingreso por traspaso entre almacenes');

-- Volcando estructura para tabla keeper.tipo_salida
CREATE TABLE IF NOT EXISTS `tipo_salida` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.tipo_salida: ~4 rows (aproximadamente)
INSERT INTO `tipo_salida` (`id`, `nombre`, `descripcion`) VALUES
	(1, 'PRODUCCION', 'Salida para producción'),
	(2, 'PROMOCION', 'Salida para promociones'),
	(3, 'MUESTRAS', 'Salida para muestras'),
	(4, 'MERMAS', 'Salida por mermas');

-- Volcando estructura para tabla keeper.traspaso
CREATE TABLE IF NOT EXISTS `traspaso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `fecha` date NOT NULL,
  `id_almacen_origen` int(11) NOT NULL,
  `id_almacen_destino` int(11) NOT NULL,
  `id_almacenero` int(11) NOT NULL,
  `glosa` text DEFAULT NULL,
  `hora` time NOT NULL,
  `estado` varchar(20) DEFAULT 'PENDIENTE',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_traspaso_codigo` (`codigo`),
  KEY `idx_traspaso_fecha` (`fecha`),
  KEY `idx_traspaso_almacen_origen` (`id_almacen_origen`),
  KEY `idx_traspaso_almacen_destino` (`id_almacen_destino`),
  KEY `idx_traspaso_almacenero` (`id_almacenero`),
  KEY `fk_traspaso_created_by` (`created_by`),
  CONSTRAINT `fk_traspaso_almacen_destino` FOREIGN KEY (`id_almacen_destino`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_traspaso_almacen_origen` FOREIGN KEY (`id_almacen_origen`) REFERENCES `almacen` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_traspaso_almacenero` FOREIGN KEY (`id_almacenero`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_traspaso_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_traspaso_estado` CHECK (`estado` in ('PENDIENTE','PROCESADO','COMPLETADO','CANCELADO'))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.traspaso: ~0 rows (aproximadamente)
INSERT INTO `traspaso` (`id`, `codigo`, `fecha`, `id_almacen_origen`, `id_almacen_destino`, `id_almacenero`, `glosa`, `hora`, `estado`, `observaciones`, `created_at`, `created_by`) VALUES
	(1, 'TRA-20251003-0001', '2024-10-03', 1, 3, 3, 'Traspaso inicial a almacén técnico', '14:30:00', 'COMPLETADO', 'Traspaso de materiales para técnicos de la zona sur', '2025-10-03 15:06:38', 2);

-- Volcando estructura para tabla keeper.traspaso_detalle
CREATE TABLE IF NOT EXISTS `traspaso_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_traspaso` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `valor_unitario` decimal(12,2) DEFAULT 0.00,
  `valor_total` decimal(12,2) DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_traspaso_producto` (`id_traspaso`,`id_producto`),
  KEY `fk_traspaso_det_producto` (`id_producto`),
  CONSTRAINT `fk_traspaso_det_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_traspaso_det_traspaso` FOREIGN KEY (`id_traspaso`) REFERENCES `traspaso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_traspaso_det_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_traspaso_det_valor` CHECK (`valor_unitario` >= 0 and `valor_total` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.traspaso_detalle: ~0 rows (aproximadamente)
INSERT INTO `traspaso_detalle` (`id`, `id_traspaso`, `id_producto`, `cantidad`, `valor_unitario`, `valor_total`, `observaciones`) VALUES
	(1, 1, 1, 2, 500.00, 1000.00, 'Producto en buen estado');

-- Volcando estructura para tabla keeper.unidad_medida
CREATE TABLE IF NOT EXISTS `unidad_medida` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `abreviatura` varchar(10) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `abreviatura` (`abreviatura`),
  KEY `idx_unidad_tipo` (`tipo`),
  KEY `idx_unidad_activo` (`activo`),
  CONSTRAINT `chk_unidad_tipo` CHECK (`tipo` in ('PESO','VOLUMEN','LONGITUD','AREA','UNIDAD','TIEMPO'))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.unidad_medida: ~7 rows (aproximadamente)
INSERT INTO `unidad_medida` (`id`, `nombre`, `abreviatura`, `tipo`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'Unidad', 'un', 'UNIDAD', 'Unidad individual', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(2, 'Kilogramo', 'kg', 'PESO', 'Unidad de peso en kilogramos', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(3, 'Metro', 'm', 'LONGITUD', 'Unidad de longitud en metros', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(4, 'Litro', 'l', 'VOLUMEN', 'Unidad de volumen en litros', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(5, 'Caja', 'cja', 'UNIDAD', 'Empaque en cajas', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(6, 'Paquete', 'paq', 'UNIDAD', 'Empaque en paquetes', 1, '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(7, 'Bobina', 'bob', 'UNIDAD', 'Bobina de cable', 1, '2025-09-30 19:45:53', '2025-09-30 19:45:53');

-- Volcando estructura para tabla keeper.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(255) DEFAULT NULL,
  `rol` varchar(20) DEFAULT 'USUARIO',
  `estado` varchar(20) DEFAULT 'ACTIVO',
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `ci` varchar(20) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuario_estado` (`estado`),
  KEY `idx_usuario_rol` (`rol`),
  CONSTRAINT `chk_usuario_rol` CHECK (`rol` in ('ADMIN','SUPERVISOR','USUARIO','SOLO_LECTURA')),
  CONSTRAINT `chk_usuario_estado` CHECK (`estado` in ('ACTIVO','INACTIVO','BLOQUEADO','SUSPENDIDO'))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla keeper.usuario: ~3 rows (aproximadamente)
INSERT INTO `usuario` (`id`, `username`, `email`, `password_hash`, `nombre_completo`, `rol`, `estado`, `ultimo_acceso`, `telefono`, `ci`, `departamento`, `created_at`, `updated_at`) VALUES
	(1, 'admin', 'admin@keeper.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador Sistema', 'ADMIN', 'ACTIVO', NULL, '70000000', NULL, 'Administración', '2025-09-24 19:23:22', '2025-09-24 19:23:22'),
	(2, 'admin1', 'admin@example.com', '$2b$10$mhdawduXKKiHkl0Pj9498.ZjsAehaANbTv7BIh4wkKtpmnnYdmFIO', NULL, 'ADMIN', 'ACTIVO', '2025-10-03 15:06:38', NULL, NULL, NULL, '2025-09-26 15:53:20', '2025-10-03 15:06:38'),
	(3, 'admin2', 'admin2@example.com', '$2b$10$1XI8jPOTXJhbsv4BpBF6ae7KG07y0gvKvsXmoKGEGk8xRopLEn/.C', NULL, 'ADMIN', 'ACTIVO', '2025-09-30 20:25:48', NULL, NULL, NULL, '2025-09-26 16:00:13', '2025-09-30 20:25:48');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
