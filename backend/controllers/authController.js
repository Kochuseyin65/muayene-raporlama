const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      companyId: user.company_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz veri',
          details: errors.array()
        }
      });
    }
    
    const { email, password } = req.body;
    
    const result = await pool.query(
      `SELECT t.*, c.name as company_name 
       FROM technicians t 
       JOIN companies c ON t.company_id = c.id 
       WHERE t.email = $1 AND t.is_active = true`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Geçersiz e-posta veya şifre'
        }
      });
    }
    
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Geçersiz e-posta veya şifre'
        }
      });
    }
    
    const token = generateToken(user);
    
    // Remove sensitive data
    delete user.password_hash;
    delete user.e_signature_pin;
    
    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Giriş yapılırken bir hata oluştu'
      }
    });
  }
};

const checkPermission = async (req, res) => {
  try {
    const { permission } = req.params;
    const userPermissions = req.user.permissions || [];
    
    // Süper admin her şeye erişebilir
    if (userPermissions.includes('superAdmin')) {
      return res.json({
        success: true,
        data: { hasPermission: true }
      });
    }
    
    const hasPermission = userPermissions.includes(permission);
    
    res.json({
      success: true,
      data: { hasPermission }
    });
    
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Yetki kontrolü yapılırken bir hata oluştu'
      }
    });
  }
};

const logout = async (req, res) => {
  try {
    // Token'i client tarafında silmek yeterli olacak
    // İsteğe bağlı olarak burada token blacklist mantığı eklenebilir
    
    res.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Çıkış yapılırken bir hata oluştu'
      }
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = { ...req.user };
    
    // Remove sensitive data
    delete user.password_hash;
    delete user.e_signature_pin;
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Profil bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
];

module.exports = {
  login,
  logout,
  checkPermission,
  getProfile,
  loginValidation
};