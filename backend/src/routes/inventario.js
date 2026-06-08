const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Ruta para obtener inventario por almacén
router.get('/almacen/:id_almacen', authMiddleware, inventarioController.getInventarioByAlmacen);

module.exports = router;