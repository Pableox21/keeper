const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const productoController = require('../controllers/productoController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
router.use(authMiddleware);
// Rutas CRUD para producto
router.get('/', productoController.getAllProductos);
router.get('/:id', requireRole('ADMIN', 'ALMACEN'), productoController.getProductoById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateProducto(false), productoController.createProducto);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateProducto(true), productoController.updateProducto);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), productoController.deleteProducto);
// router.delete('/', productoController.deleteAllProductos);

module.exports = router;
