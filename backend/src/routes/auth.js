const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

// Los ids de la URL deben ser enteros positivos
router.param('id', validate.validateIdParam);
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Login público
router.post('/login', validate.validateLogin, authController.login);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Perfil del usuario con la sesión iniciada (cualquier rol)
router.get('/me', authMiddleware, authController.getProfile);

// Gestión de usuarios (solo ADMIN)
router.get('/users', authMiddleware, requireRole('ADMIN'), authController.listUsers);
router.post('/users', authMiddleware, requireRole('ADMIN'), authController.createUser);
router.put('/users/:id', authMiddleware, requireRole('ADMIN'), authController.updateUser);
router.patch('/users/:id/estado', authMiddleware, requireRole('ADMIN'), authController.setUserStatus);
router.delete('/users/:id', authMiddleware, requireRole('ADMIN'), authController.deleteUser);

module.exports = router;
