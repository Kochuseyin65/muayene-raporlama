const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const getTechnicians = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT id, name, surname, email, phone, permissions, is_active, created_at, updated_at 
       FROM technicians 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [companyId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyenler listelenirken bir hata oluştu'
      }
    });
  }
};

const getTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT id, name, surname, email, phone, permissions, is_active, created_at, updated_at 
       FROM technicians 
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const createTechnician = async (req, res) => {
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
    
    const { name, surname, email, phone, password, eSignaturePin, permissions } = req.body;
    const companyId = req.user.company_id;
    
    // Check if email already exists
    const existingTechnician = await pool.query(
      'SELECT id FROM technicians WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingTechnician.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu e-posta adresi ile kayıtlı teknisyen zaten mevcut'
        }
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO technicians (company_id, name, surname, email, phone, password_hash, e_signature_pin, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, surname, email, phone, permissions, is_active, created_at, updated_at`,
      [companyId, name, surname, email.toLowerCase(), phone, hashedPassword, eSignaturePin || null, JSON.stringify(permissions || [])]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateTechnician = async (req, res) => {
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
    
    const { id } = req.params;
    const { name, surname, email, phone, eSignaturePin, isActive } = req.body;
    const companyId = req.user.company_id;
    
    // Check if technician exists and belongs to the same company
    const existingTechnician = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingTechnician.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    // Check if email conflicts with another technician
    const emailConflict = await pool.query(
      'SELECT id FROM technicians WHERE email = $1 AND id != $2',
      [email.toLowerCase(), id]
    );
    
    if (emailConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu e-posta adresi ile başka bir teknisyen zaten kayıtlı'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE technicians 
       SET name = $1, surname = $2, email = $3, phone = $4, e_signature_pin = $5, is_active = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, name, surname, email, phone, permissions, is_active, created_at, updated_at`,
      [name, surname, email.toLowerCase(), phone, eSignaturePin || null, isActive !== undefined ? isActive : true, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen güncellenirken bir hata oluştu'
      }
    });
  }
};

const updateTechnicianPermissions = async (req, res) => {
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
    
    const { id } = req.params;
    const { permissions } = req.body;
    const companyId = req.user.company_id;
    
    // Check if technician exists and belongs to the same company
    const existingTechnician = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingTechnician.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE technicians 
       SET permissions = $1
       WHERE id = $2 AND company_id = $3
       RETURNING id, name, surname, email, phone, permissions, is_active, created_at, updated_at`,
      [JSON.stringify(permissions || []), id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update technician permissions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen yetkileri güncellenirken bir hata oluştu'
      }
    });
  }
};

const updateTechnicianPassword = async (req, res) => {
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
    
    const { id } = req.params;
    const { newPassword } = req.body;
    const companyId = req.user.company_id;
    
    // Check if technician exists and belongs to the same company
    const existingTechnician = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingTechnician.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE technicians SET password_hash = $1 WHERE id = $2 AND company_id = $3',
      [hashedPassword, id, companyId]
    );
    
    res.json({
      success: true,
      message: 'Şifre başarıyla güncellendi'
    });
    
  } catch (error) {
    console.error('Update technician password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Şifre güncellenirken bir hata oluştu'
      }
    });
  }
};

const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if technician exists and belongs to the same company
    const existingTechnician = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingTechnician.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    // Check if technician has dependent records
    const dependentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM inspections WHERE technician_id = $1',
      [id]
    );
    
    if (parseInt(dependentCheck.rows[0].count) > 0) {
      // Soft delete instead of hard delete
      await pool.query(
        'UPDATE technicians SET is_active = false WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
      
      return res.json({
        success: true,
        message: 'Teknisyen devre dışı bırakıldı (kayıtları bulunduğu için silinemedi)'
      });
    }
    
    await pool.query('DELETE FROM technicians WHERE id = $1 AND company_id = $2', [id, companyId]);
    
    res.json({
      success: true,
      message: 'Teknisyen başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen silinirken bir hata oluştu'
      }
    });
  }
};

const createTechnicianValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('İsim 2-255 karakter arasında olmalıdır'),
  body('surname')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Soyisim 2-255 karakter arasında olmalıdır'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('tr-TR')
    .withMessage('Geçerli bir telefon numarası giriniz'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  body('eSignaturePin')
    .optional()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('E-imza PIN\'i 4-10 karakter arasında olmalıdır'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Yetkiler dizi formatında olmalıdır')
];

const updateTechnicianValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('İsim 2-255 karakter arasında olmalıdır'),
  body('surname')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Soyisim 2-255 karakter arasında olmalıdır'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('tr-TR')
    .withMessage('Geçerli bir telefon numarası giriniz'),
  body('eSignaturePin')
    .optional()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('E-imza PIN\'i 4-10 karakter arasında olmalıdır'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiflik durumu boolean olmalıdır')
];

const updatePermissionsValidation = [
  body('permissions')
    .isArray()
    .withMessage('Yetkiler dizi formatında olmalıdır')
];

const updatePasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
];

module.exports = {
  getTechnicians,
  getTechnician,
  createTechnician,
  updateTechnician,
  updateTechnicianPermissions,
  updateTechnicianPassword,
  deleteTechnician,
  createTechnicianValidation,
  updateTechnicianValidation,
  updatePermissionsValidation,
  updatePasswordValidation
};