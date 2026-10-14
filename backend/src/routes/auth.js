const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Limita el registro público para evitar creación masiva de cuentas
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiados intentos de registro, intenta más tarde' },
});

// Login público
router.post('/login', authController.login);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Registrar usuario (público, siempre con rol USUARIO)
router.post('/register', registerLimiter, authController.register);

// Perfil del usuario con la sesión iniciada (cualquier rol)
router.get('/me', authMiddleware, authController.getProfile);

// Gestión de usuarios (solo ADMIN)
router.get('/users', authMiddleware, requireRole('ADMIN'), authController.listUsers);
router.post('/users', authMiddleware, requireRole('ADMIN'), authController.createUser);
router.put('/users/:id', authMiddleware, requireRole('ADMIN'), authController.updateUser);
router.patch('/users/:id/estado', authMiddleware, requireRole('ADMIN'), authController.setUserStatus);

module.exports = router;
