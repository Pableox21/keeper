-- Segunda base de datos a la que se conecta el backend (poolExterna): simula la base operativa de la
-- otra empresa (técnicos, OLTS, contratos y clientes internos). Vive en el mismo contenedor MariaDB
-- que Keeper, pero en su propio esquema y con su propio usuario de solo lectura, así que Keeper no
-- puede consultarla con el usuario `keeper_user` ni al revés.
-- Se puede repetir: todo es IF NOT EXISTS / INSERT ... ON DUPLICATE KEY UPDATE.

CREATE DATABASE IF NOT EXISTS `empresa_externa`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `empresa_externa`;

CREATE TABLE IF NOT EXISTS `personal` (
  `CODIGO` int(11) NOT NULL,
  `NOMBRES` varchar(100) NOT NULL,
  `APELLIDOS` varchar(100) NOT NULL,
  `CARGO` varchar(50) NOT NULL,
  `ESTADO` varchar(20) NOT NULL DEFAULT 'ACTIVO',
  `CARNET` varchar(20) DEFAULT NULL,
  `TELEFONO1` varchar(20) DEFAULT NULL,
  `CORREO` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`CODIGO`),
  KEY `idx_personal_cargo` (`CARGO`),
  KEY `idx_personal_estado` (`ESTADO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `olt` (
  `codigo` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `clientes` (
  `CODIGO` int(11) NOT NULL,
  `NOMBRES` varchar(100) NOT NULL,
  `APELLIDOS` varchar(100) NOT NULL,
  PRIMARY KEY (`CODIGO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contratos` (
  `CODIGO` varchar(30) NOT NULL,
  `COD_CLI` int(11) NOT NULL,
  PRIMARY KEY (`CODIGO`),
  KEY `fk_contratos_cliente` (`COD_CLI`),
  CONSTRAINT `fk_contratos_cliente` FOREIGN KEY (`COD_CLI`) REFERENCES `clientes` (`CODIGO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario con el que Keeper lee esta base: solo SELECT, y solo sobre este esquema.
CREATE USER IF NOT EXISTS 'externa_user'@'%' IDENTIFIED BY 'externa123';
GRANT SELECT ON `empresa_externa`.* TO 'externa_user'@'%';
FLUSH PRIVILEGES;

-- Datos de ejemplo. Los CARGO y ESTADO coinciden con el filtro de getPersonalTecnico y
-- getOpcionesAlmacen; los códigos de contrato con el filtro de getOpcionesSalida (ATT-##### > 100000
-- o contrato puramente numérico).
INSERT INTO `personal` (`CODIGO`, `NOMBRES`, `APELLIDOS`, `CARGO`, `ESTADO`, `CARNET`, `TELEFONO1`, `CORREO`) VALUES
  (1001, 'Carlos', 'Mendoza Rojas', 'SOPORTE TECNICO', 'ACTIVO', 'CM-1001', '70010001', 'carlos.mendoza@ejemplo.com'),
  (1002, 'Lucia', 'Fernandez Vidal', 'INSTALADOR', 'ACTIVO', 'LF-1002', '70010002', 'lucia.fernandez@ejemplo.com'),
  (1003, 'Jorge', 'Apaza Condori', 'REDES', 'ACTIVO', 'JA-1003', '70010003', 'jorge.apaza@ejemplo.com'),
  (1004, 'Marcela', 'Gutierrez Soto', 'SOPORTE TECNICO', 'ACTIVO', 'MG-1004', '70010004', 'marcela.gutierrez@ejemplo.com'),
  (1005, 'Ruben', 'Choque Quispe', 'INSTALADOR', 'INACTIVO', 'RC-1005', '70010005', 'ruben.choque@ejemplo.com'),
  (1006, 'Andrea', 'Ramos Loza', 'ADMINISTRATIVO', 'ACTIVO', 'AR-1006', '70010006', 'andrea.ramos@ejemplo.com')
ON DUPLICATE KEY UPDATE `NOMBRES` = VALUES(`NOMBRES`);

INSERT INTO `olt` (`codigo`, `nombre`) VALUES
  (501, 'OLT ZONA CENTRAL'),
  (502, 'OLT ZONA SUR'),
  (503, 'OLT AMPLIACION NODO 4'),
  (504, 'OLT TEMPORAL OBRA 12')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `clientes` (`CODIGO`, `NOMBRES`, `APELLIDOS`) VALUES
  (9001, 'Roberto', 'Salazar Cruz'),
  (9002, 'Fabiola', 'Nina Torres'),
  (9003, 'Empresa', 'Interna Logistica'),
  (9004, 'Diego', 'Martinez Peña')
ON DUPLICATE KEY UPDATE `NOMBRES` = VALUES(`NOMBRES`);

INSERT INTO `contratos` (`CODIGO`, `COD_CLI`) VALUES
  ('ATT-100201', 9001),
  ('ATT-100202', 9002),
  ('ATT-100050', 9003),
  ('88001', 9004),
  ('TARIFAS-7', 9001)
ON DUPLICATE KEY UPDATE `COD_CLI` = VALUES(`COD_CLI`);
