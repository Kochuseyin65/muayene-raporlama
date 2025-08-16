const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.loginValidation, authController.login);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// GET /api/auth/profile
router.get('/profile', authMiddleware, authController.getProfile);

// GET /api/auth/check-permission/:permission
router.get('/check-permission/:permission', authMiddleware, authController.checkPermission);

module.exports = router;