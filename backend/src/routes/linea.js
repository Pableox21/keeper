const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: ADMIN y ALMACEN.
router.use(authMiddleware);
const lineaController = require('../controllers/lineaController');

// Rutas CRUD para línea
router.get('/', lineaController.getAllLineas);
router.get('/:id', lineaController.getLineaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, lineaController.createLinea);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, lineaController.updateLinea);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), lineaController.deleteLinea);

module.exports = router;