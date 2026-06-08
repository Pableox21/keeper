const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Obtener todos los prove.
router.get('/', proveedorController.getAllProveedores);


// Obtener por id
router.get('/:id', proveedorController.getProveedorById);



///ESTA PARTE ES MODIFICABLE, POR AHORA LA ACCION DE CREACION,EDICION,BORRADO DE PROVEEDORES esta solo para roles SUPERVIDOR o ADMIN
// Crear ->  solo ADMIN y SUPERVISOR
router.post('/', requireRole('ADMIN'), proveedorController.createProveedor);


// Actualizar -> SUPERVISOR o ADMIN
router.put('/:id', requireRole('ADMIN'), proveedorController.updateProveedor);


// Borrar -> solo ADMIN
router.delete('/:id', requireRole('ADMIN'), proveedorController.deleteProveedor);


//Actualizar a Proveedor autorizado o viceversa-> SUPERVISOR
router.post('/:id/autorizado', requireRole('ADMIN'), proveedorController.setAutorizado);


module.exports = router;
