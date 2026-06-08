const express = require('express');
const router = express.Router();
const unidadMedidaController = require('../controllers/unidadMedidaController');

// Rutas CRUD para unidades de medida
router.get('/', unidadMedidaController.getAllUnidadesMedida);
router.get('/:id', unidadMedidaController.getUnidadMedidaById);
router.post('/', unidadMedidaController.createUnidadMedida);
router.put('/:id', unidadMedidaController.updateUnidadMedida);
router.delete('/:id', unidadMedidaController.deleteUnidadMedida);

module.exports = router;