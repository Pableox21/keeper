const express = require('express');
const router = express.Router();
const traspasosController = require('../controllers/traspasosController');
const { authMiddleware, requireRole, denyRoles } = require('../middleware/authMiddleware');

// El rol ALMACEN solo trabaja con Inventarios: sin acceso a este módulo.
router.use(authMiddleware, denyRoles('ALMACEN'));

// Rutas para opciones del formulario de traspasos
router.get('/opciones', traspasosController.getOpcionesTraspaso);

// Rutas CRUD de traspasos
router.get('/', traspasosController.getAllTraspasos);
router.get('/:id', traspasosController.getTraspasoById);
router.post('/', requireRole('ADMIN'), traspasosController.createTraspaso);
router.put('/:id', requireRole('ADMIN'), traspasosController.updateTraspaso);
router.delete('/:id', requireRole('ADMIN'), traspasosController.deleteTraspaso);
router.patch('/:id/estado', requireRole('ADMIN'), traspasosController.cambiarEstadoTraspaso);


module.exports = router;