const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: ADMIN y ALMACEN.
router.use(authMiddleware);
const empresaController = require('../controllers/empresaController');

// Rutas CRUD para empresa
router.get('/', empresaController.getAllEmpresas);
router.get('/:id', empresaController.getEmpresaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, empresaController.createEmpresa);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, empresaController.updateEmpresa);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), empresaController.deleteEmpresa);

module.exports = router;
