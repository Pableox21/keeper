const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: ADMIN y ALMACEN.
router.use(authMiddleware);
const categoriaController = require('../controllers/categoriaController');

// Rutas CRUD para categoria
router.get('/', categoriaController.getAllCategorias);
router.get('/:id', categoriaController.getCategoriaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, categoriaController.createCategoria);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateCatalogo, categoriaController.updateCategoria);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), categoriaController.deleteCategoria);

module.exports = router;
