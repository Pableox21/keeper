const express = require('express');
const router = express.Router();
const traspasosController = require('../controllers/traspasosController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas para opciones del formulario de traspasos
router.get('/opciones', authMiddleware, traspasosController.getOpcionesTraspaso);

// Rutas CRUD de traspasos
router.get('/', authMiddleware, traspasosController.getAllTraspasos);
router.get('/:id', authMiddleware, traspasosController.getTraspasoById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), traspasosController.createTraspaso);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), traspasosController.updateTraspaso);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), traspasosController.deleteTraspaso);
router.patch('/:id/estado', authMiddleware, requireRole('ADMIN', 'ALMACEN'), traspasosController.cambiarEstadoTraspaso);


module.exports = router;