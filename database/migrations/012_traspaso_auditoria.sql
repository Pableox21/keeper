-- Añade a la tabla traspaso las columnas de auditoría que ya tienen almacen, ingreso, salida y producto.
-- Sin ellas, editar un traspaso y cambiar su estado (Cancelar/Completar) fallan con
-- "Unknown column 'updated_by' in 'SET'".
-- Se puede repetir: si las columnas o la clave ya existen, no hacen nada.
USE `keeper`;

ALTER TABLE `traspaso`
  ADD COLUMN IF NOT EXISTS `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  ADD COLUMN IF NOT EXISTS `updated_by` int(11) DEFAULT NULL;

ALTER TABLE `traspaso` DROP FOREIGN KEY IF EXISTS `fk_traspaso_updated_by`;

ALTER TABLE `traspaso`
  ADD CONSTRAINT `fk_traspaso_updated_by`
  FOREIGN KEY (`updated_by`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
