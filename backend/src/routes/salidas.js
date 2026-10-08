const express = require('express');
const router = express.Router();
const salidasController = require('../controllers/salidasController');
const { authMiddleware, requireRole, denyRoles } = require('../middleware/authMiddleware');

// El rol ALMACEN solo trabaja con Inventarios: sin acceso a este módulo.
router.use(authMiddleware, denyRoles('ALMACEN'));

// Rutas para opciones del formulario en Salidas
router.get('/opciones', salidasController.getOpcionesSalida);


// Rutas CRUD de salidas
router.get('/', salidasController.getAllSalidas);
router.get('/:id', salidasController.getSalidaById);
router.post('/', requireRole('ADMIN'), salidasController.createSalida);

module.exports = router;