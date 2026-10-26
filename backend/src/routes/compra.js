const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Aunque estas rutas no están montadas en app.js (las compras van por /api/ingresos),
// se protegen para que no queden públicas si algún día se montan.
router.use(authMiddleware);

router.get('/', compraController.getAllCompras);
router.get('/:id', compraController.getCompraById);
router.post('/', compraController.createCompra);
router.put('/:id', compraController.updateCompra);
router.delete('/:id', compraController.deleteCompra);

module.exports = router;
