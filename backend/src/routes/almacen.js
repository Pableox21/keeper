const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const almacenController = require('../controllers/almacenController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas publicas necesarios para crear almacens
router.get('/opciones', authMiddleware, almacenController.getOpcionesAlmacen);

// Rutas protegidas -> CRUDS
router.get('/', authMiddleware, almacenController.getAllAlmacenes);
router.get('/tipo/:tipo', authMiddleware, almacenController.getAlmacenesByTipo);
router.get('/:id', authMiddleware, almacenController.getAlmacenById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), validate.validateAlmacen, almacenController.createAlmacen);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), validate.validateAlmacen, almacenController.updateAlmacen);
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), almacenController.deleteAlmacen);
router.get('/personal/tecnicos', authMiddleware, almacenController.getPersonalTecnico);


module.exports = router;