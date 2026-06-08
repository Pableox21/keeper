const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacenController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas publicas necesarios para crear almacens
router.get('/opciones', almacenController.getOpcionesAlmacen);

// Rutas protegidas -> CRUDS
router.get('/', authMiddleware, almacenController.getAllAlmacenes);
router.get('/tipo/:tipo', authMiddleware, almacenController.getAlmacenesByTipo);
router.get('/:id', authMiddleware, almacenController.getAlmacenById);
router.post('/', authMiddleware, requireRole('ADMIN', 'ALMACEN'), almacenController.createAlmacen);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'ALMACEN'), almacenController.updateAlmacen);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), almacenController.deleteAlmacen);
router.get('/personal/tecnicos', almacenController.getPersonalTecnico);


module.exports = router;