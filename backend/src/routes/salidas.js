const express = require('express');
const router = express.Router();
const salidasController = require('../controllers/salidasController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas para opciones del formulario en Salidas
router.get('/opciones', authMiddleware, salidasController.getOpcionesSalida);


// Rutas CRUD de salidas
router.get('/', authMiddleware, salidasController.getAllSalidas);
router.get('/:id', authMiddleware, salidasController.getSalidaById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), salidasController.createSalida);

module.exports = router;