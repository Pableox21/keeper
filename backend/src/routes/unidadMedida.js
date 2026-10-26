const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: ADMIN y ALMACEN.
router.use(authMiddleware);
const unidadMedidaController = require('../controllers/unidadMedidaController');

// Rutas CRUD para unidades de medida
router.get('/', unidadMedidaController.getAllUnidadesMedida);
router.get('/:id', unidadMedidaController.getUnidadMedidaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateUnidadMedida, unidadMedidaController.createUnidadMedida);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateUnidadMedida, unidadMedidaController.updateUnidadMedida);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), unidadMedidaController.deleteUnidadMedida);

module.exports = router;