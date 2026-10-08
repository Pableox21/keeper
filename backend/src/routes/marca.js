const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
router.use(authMiddleware);
const marcaController = require('../controllers/marcaController');

// Rutas CRUD para marca
router.get('/', marcaController.getAllMarcas);
router.get('/:id', marcaController.getMarcaById);
router.post('/', requireRole('ADMIN'), marcaController.createMarca);
router.put('/:id', requireRole('ADMIN'), marcaController.updateMarca);
router.delete('/:id', requireRole('ADMIN'), marcaController.deleteMarca);

module.exports = router;