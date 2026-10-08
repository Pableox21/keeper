-- Agrega el rol ALMACEN a los roles permitidos de la tabla usuario.
-- Ejecutar UNA vez sobre la base existente (ver instrucciones en el README).
USE `keeper`;

ALTER TABLE `usuario` DROP CONSTRAINT IF EXISTS `chk_usuario_rol`;
ALTER TABLE `usuario`
  ADD CONSTRAINT `chk_usuario_rol`
  CHECK (`rol` IN ('ADMIN','ALMACEN','SUPERVISOR','USUARIO','SOLO_LECTURA'));
