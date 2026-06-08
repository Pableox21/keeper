const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Login público
router.post('/login', authController.login);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Registrar usuario
router.post('/register', authMiddleware, requireRole('ADMIN'), authController.register);
//router.post('/register', authController.register);



module.exports = router;
