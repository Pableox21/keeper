const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
router.use(authMiddleware);
const unidadMedidaController = require('../controllers/unidadMedidaController');

// Rutas CRUD para unidades de medida
router.get('/', unidadMedidaController.getAllUnidadesMedida);
router.get('/:id', unidadMedidaController.getUnidadMedidaById);
router.post('/', requireRole('ADMIN'), unidadMedidaController.createUnidadMedida);
router.put('/:id', requireRole('ADMIN'), unidadMedidaController.updateUnidadMedida);
router.delete('/:id', requireRole('ADMIN'), unidadMedidaController.deleteUnidadMedida);

module.exports = router;