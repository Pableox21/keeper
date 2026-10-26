const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const salidasController = require('../controllers/salidasController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Rutas para opciones del formulario en Salidas
router.get('/opciones', salidasController.getOpcionesSalida);


// Rutas CRUD de salidas
router.get('/', salidasController.getAllSalidas);
router.get('/:id', salidasController.getSalidaById);
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateSalida, salidasController.createSalida);

module.exports = router;