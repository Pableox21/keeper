const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
router.use(authMiddleware);
// Rutas CRUD para producto
router.get('/', productoController.getAllProductos);
router.get('/:id', requireRole('ADMIN'), productoController.getProductoById);
router.post('/', requireRole('ADMIN'), productoController.createProducto);
router.put('/:id', requireRole('ADMIN'), productoController.updateProducto);
router.delete('/:id', requireRole('ADMIN'), productoController.deleteProducto);
// router.delete('/', productoController.deleteAllProductos);

module.exports = router;
