const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const clienteController = require('../controllers/clienteController');
const { authMiddleware, requireRole, denyRoles } = require('../middleware/authMiddleware');

// La cartera de clientes no le corresponde al rol ALMACEN: sin acceso a este módulo.
router.use(authMiddleware, denyRoles('ALMACEN'));

// Lectura: cualquier usuario autenticado (salvo ALMACEN). Escritura: ADMIN y ATENCION_CLIENTE,
// que solo puede operar aquí (ver ROLE_SCOPES en authMiddleware).
router.get('/', clienteController.getAllClientes);
router.post('/', requireRole('ADMIN', 'ATENCION_CLIENTE'), clienteController.createCliente);
router.put('/:id', requireRole('ADMIN', 'ATENCION_CLIENTE'), clienteController.updateCliente);
router.patch('/:id/estado', requireRole('ADMIN', 'ATENCION_CLIENTE'), clienteController.setClienteEstado);
router.delete('/:id', requireRole('ADMIN', 'ATENCION_CLIENTE'), clienteController.deleteCliente);

module.exports = router;
