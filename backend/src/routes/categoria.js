const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
router.use(authMiddleware);
const categoriaController = require('../controllers/categoriaController');

// Rutas CRUD para categoria
router.get('/', categoriaController.getAllCategorias);
router.get('/:id', categoriaController.getCategoriaById);
router.post('/', requireRole('ADMIN'), categoriaController.createCategoria);
router.put('/:id', requireRole('ADMIN'), categoriaController.updateCategoria);
router.delete('/:id', requireRole('ADMIN'), categoriaController.deleteCategoria);

module.exports = router;
