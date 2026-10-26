const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const traspasosController = require('../controllers/traspasosController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Rutas para opciones del formulario de traspasos
router.get('/opciones', traspasosController.getOpcionesTraspaso);

// Rutas CRUD de traspasos
router.get('/', traspasosController.getAllTraspasos);
router.get('/:id', traspasosController.getTraspasoById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateTraspaso, traspasosController.createTraspaso);
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateTraspaso, traspasosController.updateTraspaso);
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), traspasosController.deleteTraspaso);
router.patch('/:id/estado', requireRole('ADMIN', 'ALMACEN'), traspasosController.cambiarEstadoTraspaso);


module.exports = router;