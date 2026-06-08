const express = require('express');
const router = express.Router();
const lineaController = require('../controllers/lineaController');

// Rutas CRUD para línea
router.get('/', lineaController.getAllLineas);
router.get('/:id', lineaController.getLineaById);
router.post('/', lineaController.createLinea);
router.put('/:id', lineaController.updateLinea);
router.delete('/:id', lineaController.deleteLinea);

module.exports = router;