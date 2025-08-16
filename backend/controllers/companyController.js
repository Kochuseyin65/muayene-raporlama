const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const getAllCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, tax_number, address, contact, logo_url, created_at, updated_at FROM companies ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firmalar listelenirken bir hata oluştu'
      }
    });
  }
};

const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, tax_number, address, contact, logo_url, created_at, updated_at FROM companies WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firma bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firma bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const createCompany = async (req, res) => {
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
    
    const { name, taxNumber, address, contact, logoUrl } = req.body;
    
    // Check if tax number already exists
    const existingCompany = await pool.query(
      'SELECT id FROM companies WHERE tax_number = $1',
      [taxNumber]
    );
    
    if (existingCompany.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu vergi numarası ile kayıtlı firma zaten mevcut'
        }
      });
    }
    
    const result = await pool.query(
      'INSERT INTO companies (name, tax_number, address, contact, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, tax_number, address, contact, logo_url, created_at, updated_at',
      [name, taxNumber, address, contact, logoUrl || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firma oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateCompany = async (req, res) => {
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
    const { name, taxNumber, address, contact, logoUrl } = req.body;
    
    // Super admin can update any company, company admin can only update their own company
    let companyIdToUpdate = id;
    if (!req.user.permissions.includes('superAdmin')) {
      if (parseInt(id) !== req.user.company_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Sadece kendi firmanızı güncelleyebilirsiniz'
          }
        });
      }
    }
    
    // Check if company exists
    const existingCompany = await pool.query(
      'SELECT id FROM companies WHERE id = $1',
      [companyIdToUpdate]
    );
    
    if (existingCompany.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firma bulunamadı'
        }
      });
    }
    
    // Check if tax number conflicts with another company
    const taxConflict = await pool.query(
      'SELECT id FROM companies WHERE tax_number = $1 AND id != $2',
      [taxNumber, companyIdToUpdate]
    );
    
    if (taxConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu vergi numarası ile başka bir firma zaten kayıtlı'
        }
      });
    }
    
    const result = await pool.query(
      'UPDATE companies SET name = $1, tax_number = $2, address = $3, contact = $4, logo_url = $5 WHERE id = $6 RETURNING id, name, tax_number, address, contact, logo_url, created_at, updated_at',
      [name, taxNumber, address, contact, logoUrl || null, companyIdToUpdate]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firma güncellenirken bir hata oluştu'
      }
    });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existingCompany = await pool.query(
      'SELECT id FROM companies WHERE id = $1',
      [id]
    );
    
    if (existingCompany.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firma bulunamadı'
        }
      });
    }
    
    // Check if company has dependent records
    const dependentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM technicians WHERE company_id = $1',
      [id]
    );
    
    if (parseInt(dependentCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu firmaya bağlı teknisyenler bulunduğu için silinemez'
        }
      });
    }
    
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Firma başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firma silinirken bir hata oluştu'
      }
    });
  }
};

const createCompanyValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Firma adı 2-255 karakter arasında olmalıdır'),
  body('taxNumber')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('Vergi numarası 10-50 karakter arasında olmalıdır'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Adres maksimum 1000 karakter olabilir'),
  body('contact')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('İletişim bilgisi maksimum 255 karakter olabilir'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Geçerli bir URL giriniz')
];

const updateCompanyValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Firma adı 2-255 karakter arasında olmalıdır'),
  body('taxNumber')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('Vergi numarası 10-50 karakter arasında olmalıdır'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Adres maksimum 1000 karakter olabilir'),
  body('contact')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('İletişim bilgisi maksimum 255 karakter olabilir'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Geçerli bir URL giriniz')
];

const getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      'SELECT id, name, tax_number, address, contact, logo_url, created_at, updated_at FROM companies WHERE id = $1',
      [companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Firma bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Firma profili alınırken bir hata oluştu'
      }
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompany,
  getCompanyProfile,
  createCompany,
  updateCompany,
  deleteCompany,
  createCompanyValidation,
  updateCompanyValidation
};