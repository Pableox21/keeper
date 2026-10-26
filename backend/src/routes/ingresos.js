const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const ingresosController = require('../controllers/ingresosController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas para opciones del formulario
router.get('/opciones', authMiddleware, ingresosController.getOpcionesIngreso);

// Rutas CRUD de ingresos por compras: los usan Compras e Inventario Inicial.
router.get('/', authMiddleware, ingresosController.getAllIngresos);
router.get('/:id', authMiddleware, ingresosController.getIngresoById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), validate.validateIngreso, ingresosController.createIngreso);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), validate.validateIngreso, ingresosController.updateIngreso);
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), ingresosController.deleteIngreso);

module.exports = router;