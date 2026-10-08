const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
router.use(authMiddleware);
const lineaController = require('../controllers/lineaController');

// Rutas CRUD para línea
router.get('/', lineaController.getAllLineas);
router.get('/:id', lineaController.getLineaById);
router.post('/', requireRole('ADMIN'), lineaController.createLinea);
router.put('/:id', requireRole('ADMIN'), lineaController.updateLinea);
router.delete('/:id', requireRole('ADMIN'), lineaController.deleteLinea);

module.exports = router;