const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Rutas CRUD para categoria
router.get('/', categoriaController.getAllCategorias);
router.get('/:id', categoriaController.getCategoriaById);
router.post('/', categoriaController.createCategoria);
router.put('/:id', categoriaController.updateCategoria);
router.delete('/:id', categoriaController.deleteCategoria);

module.exports = router;
