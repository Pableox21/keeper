const express = require('express');
const router = express.Router();
const tipoDocController = require('../controllers/tipoDocController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, tipoDocController.getAllTipoDoc);

module.exports = router;
