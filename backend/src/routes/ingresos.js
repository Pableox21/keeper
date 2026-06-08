const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresosController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas para opciones del formulario
router.get('/opciones', authMiddleware, ingresosController.getOpcionesIngreso);

// Rutas CRUD de ingresos por compras
router.get('/', authMiddleware, ingresosController.getAllIngresos);
router.get('/:id', authMiddleware, ingresosController.getIngresoById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), ingresosController.createIngreso);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), ingresosController.updateIngreso);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), ingresosController.deleteIngreso);

module.exports = router;