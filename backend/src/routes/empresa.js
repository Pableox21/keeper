const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
router.use(authMiddleware);
const empresaController = require('../controllers/empresaController');

// Rutas CRUD para empresa
router.get('/', empresaController.getAllEmpresas);
router.get('/:id', empresaController.getEmpresaById);
router.post('/', requireRole('ADMIN'), empresaController.createEmpresa);
router.put('/:id', requireRole('ADMIN'), empresaController.updateEmpresa);
router.delete('/:id', requireRole('ADMIN'), empresaController.deleteEmpresa);

module.exports = router;
