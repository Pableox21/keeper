-- Quita el rol SUPERVISOR y agrega ATENCION_CLIENTE (gestión de clientes) en la tabla usuario.
-- Los usuarios que estaban como SUPERVISOR pasan a SOLO_LECTURA.
-- Ejecutar UNA vez sobre la base existente (ver instrucciones en el README).
USE `keeper`;

UPDATE `usuario` SET `rol` = 'SOLO_LECTURA' WHERE `rol` = 'SUPERVISOR';

ALTER TABLE `usuario` DROP CONSTRAINT IF EXISTS `chk_usuario_rol`;
ALTER TABLE `usuario`
  ADD CONSTRAINT `chk_usuario_rol`
  CHECK (`rol` IN ('ADMIN','ALMACEN','USUARIO','SOLO_LECTURA','ATENCION_CLIENTE'));
