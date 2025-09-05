const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const getEquipment = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { page = 1, limit = 50, search, type } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, type, template, is_active, created_at, updated_at 
      FROM equipment 
      WHERE company_id = $1 AND is_active = true
    `;
    let params = [companyId];
    
    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR type ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM equipment WHERE company_id = $1 AND is_active = true';
    let countParams = [companyId];
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR type ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        equipment: result.rows,
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
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipmanlar listelenirken bir hata oluştu'
      }
    });
  }
};

const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT id, name, type, template, is_active, created_at, updated_at 
       FROM equipment 
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ekipman bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get equipment by id error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const getEquipmentTypes = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT DISTINCT type 
       FROM equipment 
       WHERE company_id = $1 AND is_active = true 
       ORDER BY type`,
      [companyId]
    );
    
    res.json({
      success: true,
      data: result.rows.map(row => row.type)
    });
    
  } catch (error) {
    console.error('Get equipment types error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman türleri listelenirken bir hata oluştu'
      }
    });
  }
};

const createEquipment = async (req, res) => {
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
    
    const { name, type, template } = req.body;
    const companyId = req.user.company_id;
    
    // Check if equipment name already exists for this company and type
    const existingEquipment = await pool.query(
      'SELECT id FROM equipment WHERE name = $1 AND type = $2 AND company_id = $3',
      [name, type, companyId]
    );
    
    if (existingEquipment.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu isim ve türde ekipman zaten mevcut'
        }
      });
    }
    
    // Validate template structure
    if (!validateTemplate(template)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz şablon yapısı'
        }
      });
    }
    
    const result = await pool.query(
      `INSERT INTO equipment (company_id, name, type, template) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, type, template, is_active, created_at, updated_at`,
      [companyId, name, type, JSON.stringify(template)]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateEquipment = async (req, res) => {
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
    const { name, type, template, isActive } = req.body;
    const companyId = req.user.company_id;
    
    // Check if equipment exists and belongs to the same company
    const existingEquipment = await pool.query(
      'SELECT id FROM equipment WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingEquipment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ekipman bulunamadı'
        }
      });
    }
    
    // Check if name conflicts with another equipment
    const nameConflict = await pool.query(
      'SELECT id FROM equipment WHERE name = $1 AND type = $2 AND company_id = $3 AND id != $4',
      [name, type, companyId, id]
    );
    
    if (nameConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu isim ve türde başka bir ekipman zaten mevcut'
        }
      });
    }
    
    // Validate template structure if provided
    if (template && !validateTemplate(template)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz şablon yapısı'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE equipment 
       SET name = $1, type = $2, template = $3, is_active = $4
       WHERE id = $5 AND company_id = $6
       RETURNING id, name, type, template, is_active, created_at, updated_at`,
      [name, type, JSON.stringify(template), isActive !== undefined ? isActive : true, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman güncellenirken bir hata oluştu'
      }
    });
  }
};

const updateEquipmentTemplate = async (req, res) => {
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
    const { template } = req.body;
    const companyId = req.user.company_id;
    
    // Check if equipment exists and belongs to the same company
    const existingEquipment = await pool.query(
      'SELECT id FROM equipment WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingEquipment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ekipman bulunamadı'
        }
      });
    }
    
    // Validate template structure
    if (!validateTemplate(template)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz şablon yapısı'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE equipment 
       SET template = $1
       WHERE id = $2 AND company_id = $3
       RETURNING id, name, type, template, is_active, created_at, updated_at`,
      [JSON.stringify(template), id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update equipment template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman şablonu güncellenirken bir hata oluştu'
      }
    });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if equipment exists and belongs to the same company
    const existingEquipment = await pool.query(
      'SELECT id FROM equipment WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingEquipment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ekipman bulunamadı'
        }
      });
    }
    
    // Check if equipment has dependent records
    const dependentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM inspections WHERE equipment_id = $1',
      [id]
    );
    
    if (parseInt(dependentCheck.rows[0].count) > 0) {
      // Soft delete instead of hard delete
      await pool.query(
        'UPDATE equipment SET is_active = false WHERE id = $1 AND company_id = $2',
        [id, companyId]
      );
      
      return res.json({
        success: true,
        message: 'Ekipman devre dışı bırakıldı (muayene kayıtları bulunduğu için silinemedi)'
      });
    }
    
    await pool.query('DELETE FROM equipment WHERE id = $1 AND company_id = $2', [id, companyId]);
    
    res.json({
      success: true,
      message: 'Ekipman başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ekipman silinirken bir hata oluştu'
      }
    });
  }
};

// Template validation helper function
const validateTemplate = (template) => {
  try {
    if (!template || typeof template !== 'object') {
      return false;
    }
    
    if (!template.sections || !Array.isArray(template.sections)) {
      return false;
    }
    
    for (const section of template.sections) {
      if (!section.title || typeof section.title !== 'string') return false;

      // Support both legacy and typed sections
      if (section.type) {
        const st = section.type;
        const validSectionTypes = ['key_value', 'checklist', 'table', 'photos', 'notes'];
        if (!validSectionTypes.includes(st)) return false;
        if (st === 'key_value') {
          if (!Array.isArray(section.items)) return false;
          for (const it of section.items) {
            if (!it.name || typeof it.name !== 'string') return false;
            const vt = it.valueType || 'text';
            const validV = ['text','number','date','select'];
            if (!validV.includes(vt)) return false;
            if (vt === 'select' && (!Array.isArray(it.options) || it.options.length === 0)) return false;
          }
        } else if (st === 'checklist') {
          if (!Array.isArray(section.questions)) return false;
          for (const q of section.questions) {
            if (!q.name || !q.label) return false;
            if (!Array.isArray(q.options) || q.options.length === 0) return false;
          }
        } else if (st === 'table') {
          if (!Array.isArray(section.columns) || section.columns.length === 0) return false;
          for (const c of section.columns) {
            if (!c.name || !c.label) return false;
          }
        } else if (st === 'photos') {
          if (!section.field || typeof section.field !== 'string') return false;
        } else if (st === 'notes') {
          if (!section.field || typeof section.field !== 'string') return false;
        }
      } else {
        // Legacy format with fields[]
        if (!section.fields || !Array.isArray(section.fields)) return false;
        for (const field of section.fields) {
          if (!field.name || typeof field.name !== 'string') return false;
          if (!field.type || typeof field.type !== 'string') return false;
          const validTypes = ['text', 'number', 'date', 'select', 'table', 'photo'];
          if (!validTypes.includes(field.type)) return false;
          if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) return false;
          if (field.type === 'table' && (!field.columns || !Array.isArray(field.columns))) return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

const createEquipmentValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Ekipman adı 2-255 karakter arasında olmalıdır'),
  body('type')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Ekipman türü 2-255 karakter arasında olmalıdır'),
  body('template')
    .notEmpty()
    .withMessage('Şablon gereklidir')
];

const updateEquipmentValidation = [
  body('name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Ekipman adı 2-255 karakter arasında olmalıdır'),
  body('type')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Ekipman türü 2-255 karakter arasında olmalıdır'),
  body('template')
    .notEmpty()
    .withMessage('Şablon gereklidir'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiflik durumu boolean olmalıdır')
];

const updateTemplateValidation = [
  body('template')
    .notEmpty()
    .withMessage('Şablon gereklidir')
];

module.exports = {
  getEquipment,
  getEquipmentById,
  getEquipmentTypes,
  createEquipment,
  updateEquipment,
  updateEquipmentTemplate,
  deleteEquipment,
  createEquipmentValidation,
  updateEquipmentValidation,
  updateTemplateValidation
};
