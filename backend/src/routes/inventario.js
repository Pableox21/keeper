const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
router.param('id_almacen', validate.validateIdParam);
const inventarioController = require('../controllers/inventarioController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ruta para obtener inventario por almacén
router.get('/almacen/:id_almacen', authMiddleware, inventarioController.getInventarioByAlmacen);

module.exports = router;