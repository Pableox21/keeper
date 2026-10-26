const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const proveedorController = require('../controllers/proveedorController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Obtener todos los prove.
router.get('/', proveedorController.getAllProveedores);


// Obtener por id
router.get('/:id', proveedorController.getProveedorById);



// Crear -> ADMIN y ALMACEN
router.post('/', requireRole('ADMIN', 'ALMACEN'), validate.validateProveedor(false), proveedorController.createProveedor);


// Actualizar -> ADMIN y ALMACEN
router.put('/:id', requireRole('ADMIN', 'ALMACEN'), validate.validateProveedor(true), proveedorController.updateProveedor);


// Borrar -> ADMIN y ALMACEN
router.delete('/:id', requireRole('ADMIN', 'ALMACEN'), proveedorController.deleteProveedor);


//Actualizar a Proveedor autorizado o viceversa-> ADMIN y ALMACEN
router.post('/:id/autorizado', requireRole('ADMIN', 'ALMACEN'), proveedorController.setAutorizado);


module.exports = router;
