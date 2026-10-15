const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { authMiddleware, requireRole, denyRoles } = require('../middleware/authMiddleware');

// El rol ALMACEN solo trabaja con Inventarios: sin acceso a clientes.
router.use(authMiddleware, denyRoles('ALMACEN'));

// Lectura: cualquier usuario autenticado (salvo ALMACEN). Escritura: solo ADMIN.
router.get('/', clienteController.getAllClientes);
router.post('/', requireRole('ADMIN'), clienteController.createCliente);
router.put('/:id', requireRole('ADMIN'), clienteController.updateCliente);
router.patch('/:id/estado', requireRole('ADMIN'), clienteController.setClienteEstado);
router.delete('/:id', requireRole('ADMIN'), clienteController.deleteCliente);

module.exports = router;
