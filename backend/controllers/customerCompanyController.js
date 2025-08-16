const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const getCustomerCompanies = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { page = 1, limit = 50, search } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, tax_number, address, contact, email, authorized_person, created_at, updated_at 
      FROM customer_companies 
      WHERE company_id = $1
    `;
    let params = [companyId];
    
    if (search) {
      query += ` AND (name ILIKE $2 OR tax_number ILIKE $2 OR email ILIKE $2)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM customer_companies WHERE company_id = $1';
    let countParams = [companyId];
    
    if (search) {
      countQuery += ` AND (name ILIKE $2 OR tax_number ILIKE $2 OR email ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: (page * limit) < totalCount,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get customer companies error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Müşteri firmalar listelenirken bir hata oluştu'
      }
    });
  }
};

const getCustomerCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT id, name, tax_number, address, contact, email, authorized_person, created_at, updated_at 
       FROM customer_companies 
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Müşteri firma bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get customer company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Müşteri firma bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const createCustomerCompany = async (req, res) => {
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
    
    const { name, taxNumber, address, contact, email, authorizedPerson } = req.body;
    const companyId = req.user.company_id;
    
    // Check if tax number already exists for this company
    if (taxNumber) {
      const existingCustomer = await pool.query(
        'SELECT id FROM customer_companies WHERE tax_number = $1 AND company_id = $2',
        [taxNumber, companyId]
      );
      
      if (existingCustomer.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Bu vergi numarası ile kayıtlı müşteri firma zaten mevcut'
          }
        });
      }
    }
    
    // Check if email already exists for this company
    const existingEmail = await pool.query(
      'SELECT id FROM customer_companies WHERE email = $1 AND company_id = $2',
      [email.toLowerCase(), companyId]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu e-posta adresi ile kayıtlı müşteri firma zaten mevcut'
        }
      });
    }
    
    const result = await pool.query(
      `INSERT INTO customer_companies (company_id, name, tax_number, address, contact, email, authorized_person) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, tax_number, address, contact, email, authorized_person, created_at, updated_at`,
      [companyId, name, taxNumber || null, address || null, contact || null, email.toLowerCase(), authorizedPerson || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create customer company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Müşteri firma oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateCustomerCompany = async (req, res) => {
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
    const { name, taxNumber, address, contact, email, authorizedPerson } = req.body;
    const companyId = req.user.company_id;
    
    // Check if customer company exists and belongs to the same company
    const existingCustomer = await pool.query(
      'SELECT id FROM customer_companies WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Müşteri firma bulunamadı'
        }
      });
    }
    
    // Check if tax number conflicts with another customer company
    if (taxNumber) {
      const taxConflict = await pool.query(
        'SELECT id FROM customer_companies WHERE tax_number = $1 AND company_id = $2 AND id != $3',
        [taxNumber, companyId, id]
      );
      
      if (taxConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Bu vergi numarası ile başka bir müşteri firma zaten kayıtlı'
          }
        });
      }
    }
    
    // Check if email conflicts with another customer company
    const emailConflict = await pool.query(
      'SELECT id FROM customer_companies WHERE email = $1 AND company_id = $2 AND id != $3',
      [email.toLowerCase(), companyId, id]
    );
    
    if (emailConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu e-posta adresi ile başka bir müşteri firma zaten kayıtlı'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE customer_companies 
       SET name = $1, tax_number = $2, address = $3, contact = $4, email = $5, authorized_person = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, name, tax_number, address, contact, email, authorized_person, created_at, updated_at`,
      [name, taxNumber || null, address || null, contact || null, email.toLowerCase(), authorizedPerson || null, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update customer company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Müşteri firma güncellenirken bir hata oluştu'
      }
    });
  }
};

const deleteCustomerCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if customer company exists and belongs to the same company
    const existingCustomer = await pool.query(
      'SELECT id FROM customer_companies WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Müşteri firma bulunamadı'
        }
      });
    }
    
    // Check if customer company has dependent records
    const dependentChecks = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM offers WHERE customer_company_id = $1', [id]),
      pool.query('SELECT COUNT(*) as count FROM work_orders WHERE customer_company_id = $1', [id])
    ]);
    
    const totalDependents = dependentChecks.reduce((sum, result) => sum + parseInt(result.rows[0].count), 0);
    
    if (totalDependents > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu müşteri firmaya bağlı teklifler veya iş emirleri bulunduğu için silinemez'
        }
      });
    }
    
    await pool.query('DELETE FROM customer_companies WHERE id = $1 AND company_id = $2', [id, companyId]);
    
    res.json({
      success: true,
      message: 'Müşteri firma başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Delete customer company error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Müşteri firma silinirken bir hata oluştu'
      }
    });
  }
};

const createCustomerCompanyValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Firma adı 2-255 karakter arasında olmalıdır'),
  body('taxNumber')
    .optional()
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
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('authorizedPerson')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Yetkili kişi maksimum 255 karakter olabilir')
];

const updateCustomerCompanyValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Firma adı 2-255 karakter arasında olmalıdır'),
  body('taxNumber')
    .optional()
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
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('authorizedPerson')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Yetkili kişi maksimum 255 karakter olabilir')
];

module.exports = {
  getCustomerCompanies,
  getCustomerCompany,
  createCustomerCompany,
  updateCustomerCompany,
  deleteCustomerCompany,
  createCustomerCompanyValidation,
  updateCustomerCompanyValidation
};