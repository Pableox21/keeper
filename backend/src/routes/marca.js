const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: ADMIN y ALMACEN.
router.use(authMiddleware);
const marcaController = require('../controllers/marcaController');

// Rutas CRUD para marca
router.get('/', marcaController.getAllMarcas);
router.get('/:id', marcaController.getMarcaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, marcaController.createMarca);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, marcaController.updateMarca);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), marcaController.deleteMarca);

module.exports = router;