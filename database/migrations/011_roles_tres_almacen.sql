-- Deja solo tres roles: ADMIN, ALMACEN y ATENCION_CLIENTE.
-- Quita USUARIO y SOLO_LECTURA, y amplía ALMACEN a todo el inventario (menos clientes y usuarios).
-- Las cuentas con roles retirados pasan a ALMACEN y quedan INACTIVAS: un ADMIN decide si reactivarlas.
-- También cambia el valor por defecto de la columna, que apuntaba a un rol inexistente.
-- Ejecutar UNA vez sobre la base existente (ver instrucciones en el README).
USE `keeper`;

UPDATE `usuario`
   SET `rol` = 'ALMACEN', `estado` = 'INACTIVO'
 WHERE `rol` IN ('SUPERVISOR', 'USUARIO', 'SOLO_LECTURA');

ALTER TABLE `usuario` DROP CONSTRAINT IF EXISTS `chk_usuario_rol`;
ALTER TABLE `usuario`
  ADD CONSTRAINT `chk_usuario_rol`
  CHECK (`rol` IN ('ADMIN','ALMACEN','ATENCION_CLIENTE'));

ALTER TABLE `usuario` ALTER COLUMN `rol` SET DEFAULT 'ALMACEN';
