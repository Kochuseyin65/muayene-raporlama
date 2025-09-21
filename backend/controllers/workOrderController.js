const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const generateWorkOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `WO-${timestamp}${random}`;
};

const generateInspectionNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INSP-${timestamp}${random}`;
};

const getWorkOrders = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { page = 1, limit = 20, status, assignedTo, search, customerCompanyId, mine } = req.query;

    const offset = (page - 1) * limit;

    const normalizeId = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const mineSelected = typeof mine === 'string' && ['true', '1', 'yes'].includes(mine.toLowerCase());
    const hasFullPermission = (req.user.permissions || []).includes('viewWorkOrders');
    const technicianFilterId = mineSelected || !hasFullPermission ? req.user.id : normalizeId(assignedTo);

    let query = `
      SELECT wo.*, cc.name as customer_name, cc.email as customer_email,
             t.name as created_by_name, t.surname as created_by_surname,
             o.offer_number,
             COUNT(i.id) as inspection_count,
             COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_inspections
      FROM work_orders wo
      JOIN customer_companies cc ON wo.customer_company_id = cc.id
      JOIN technicians t ON wo.created_by = t.id
      LEFT JOIN offers o ON wo.offer_id = o.id
      LEFT JOIN inspections i ON wo.id = i.work_order_id
      WHERE wo.company_id = $1
    `;
    let params = [companyId];
    
    if (status) {
      query += ` AND wo.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (wo.work_order_number ILIKE $${params.length + 1} OR cc.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (customerCompanyId) {
      query += ` AND wo.customer_company_id = $${params.length + 1}`;
      params.push(customerCompanyId);
    }
    
    if (technicianFilterId) {
      query += ` AND EXISTS (
        SELECT 1 FROM work_order_assignments woa 
        WHERE woa.work_order_id = wo.id AND woa.technician_id = $${params.length + 1}
      )`;
      params.push(technicianFilterId);
    }

    query += ` GROUP BY wo.id, cc.name, cc.email, t.name, t.surname, o.offer_number`;
    query += ` ORDER BY wo.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get assigned technicians for each work order
    for (const workOrder of result.rows) {
      const techniciansResult = await pool.query(
        `SELECT t.id, t.name, t.surname, t.email
         FROM work_order_assignments woa
         JOIN technicians t ON woa.technician_id = t.id
         WHERE woa.work_order_id = $1`,
        [workOrder.id]
      );
      workOrder.assignedTechnicians = techniciansResult.rows;
    }
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT wo.id) 
      FROM work_orders wo 
      JOIN customer_companies cc ON wo.customer_company_id = cc.id 
      WHERE wo.company_id = $1
    `;
    let countParams = [companyId];
    
    if (status) {
      countQuery += ` AND wo.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ` AND (wo.work_order_number ILIKE $${countParams.length + 1} OR cc.name ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    if (customerCompanyId) {
      countQuery += ` AND wo.customer_company_id = $${countParams.length + 1}`;
      countParams.push(customerCompanyId);
    }
    
    if (technicianFilterId) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM work_order_assignments woa 
        WHERE woa.work_order_id = wo.id AND woa.technician_id = $${countParams.length + 1}
      )`;
      countParams.push(technicianFilterId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        workOrders: result.rows,
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
    console.error('Get work orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emirleri listelenirken bir hata oluştu'
      }
    });
  }
};

const getWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT wo.*, cc.name as customer_name, cc.email as customer_email,
              cc.tax_number as customer_tax_number, cc.address as customer_address,
              cc.contact as customer_contact, cc.authorized_person as customer_authorized_person,
              t.name as created_by_name, t.surname as created_by_surname,
              o.offer_number, o.items as offer_items
       FROM work_orders wo
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       JOIN technicians t ON wo.created_by = t.id
       LEFT JOIN offers o ON wo.offer_id = o.id
       WHERE wo.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }
    
    const workOrder = result.rows[0];
    
    // Get assigned technicians
    const techniciansResult = await pool.query(
      `SELECT t.id, t.name, t.surname, t.email, woa.assigned_at
       FROM work_order_assignments woa
       JOIN technicians t ON woa.technician_id = t.id
       WHERE woa.work_order_id = $1`,
      [id]
    );
    workOrder.assignedTechnicians = techniciansResult.rows;
    
    // Get inspections
    const inspectionsResult = await pool.query(
      `SELECT i.*, e.name as equipment_name, e.type as equipment_type,
              t.name as technician_name, t.surname as technician_surname
       FROM inspections i
       JOIN equipment e ON i.equipment_id = e.id
       JOIN technicians t ON i.technician_id = t.id
       WHERE i.work_order_id = $1
       ORDER BY i.inspection_date, i.start_time`,
      [id]
    );
    workOrder.inspections = inspectionsResult.rows;
    
    res.json({
      success: true,
      data: workOrder
    });
    
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const createWorkOrder = async (req, res) => {
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
    
    const { customerCompanyId, assignedTechnicians, scheduledDate, equipmentIds, notes } = req.body;
    const companyId = req.user.company_id;
    const createdBy = req.user.id;
    
    // Verify customer company belongs to the same company
    const customerCheck = await pool.query(
      'SELECT id FROM customer_companies WHERE id = $1 AND company_id = $2',
      [customerCompanyId, companyId]
    );
    
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Müşteri firma bulunamadı'
        }
      });
    }
    
    // Verify all technicians belong to the same company
    if (assignedTechnicians && assignedTechnicians.length > 0) {
      const technicianCheck = await pool.query(
        'SELECT id FROM technicians WHERE id = ANY($1) AND company_id = $2 AND is_active = true',
        [assignedTechnicians, companyId]
      );
      
      if (technicianCheck.rows.length !== assignedTechnicians.length) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Bir veya daha fazla teknisyen bulunamadı'
          }
        });
      }
    }
    
    // Verify all equipment belongs to the same company
    if (equipmentIds && equipmentIds.length > 0) {
      const equipmentCheck = await pool.query(
        'SELECT id FROM equipment WHERE id = ANY($1) AND company_id = $2 AND is_active = true',
        [equipmentIds, companyId]
      );
      
      if (equipmentCheck.rows.length !== equipmentIds.length) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Bir veya daha fazla ekipman bulunamadı'
          }
        });
      }
    }
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const workOrderNumber = generateWorkOrderNumber();
      
      // Create work order
      const workOrderResult = await client.query(
        `INSERT INTO work_orders (company_id, work_order_number, customer_company_id, scheduled_date, notes, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [companyId, workOrderNumber, customerCompanyId, scheduledDate || null, notes || null, createdBy]
      );
      
      const workOrder = workOrderResult.rows[0];
      
      // Assign technicians
      if (assignedTechnicians && assignedTechnicians.length > 0) {
        for (const technicianId of assignedTechnicians) {
          await client.query(
            'INSERT INTO work_order_assignments (work_order_id, technician_id) VALUES ($1, $2)',
            [workOrder.id, technicianId]
          );
        }
      }
      
      // Create inspections for equipment
      if (equipmentIds && equipmentIds.length > 0) {
        const defaultTechnician = assignedTechnicians && assignedTechnicians.length > 0 
          ? assignedTechnicians[0] 
          : createdBy;
        
        for (const equipmentId of equipmentIds) {
          await client.query(
            `INSERT INTO inspections (work_order_id, equipment_id, technician_id, inspection_date, start_time, end_time, inspection_data, inspection_number) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              workOrder.id, 
              equipmentId, 
              defaultTechnician,
              scheduledDate || new Date(),
              '09:00',
              '17:00',
              JSON.stringify({}),
              generateInspectionNumber()
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: workOrder
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateWorkOrder = async (req, res) => {
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
    const { customerCompanyId, scheduledDate, notes } = req.body;
    const companyId = req.user.company_id;
    
    // Check if work order exists and belongs to the same company
    const existingWorkOrder = await pool.query(
      'SELECT id, status FROM work_orders WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingWorkOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }
    
    const workOrder = existingWorkOrder.rows[0];
    if (['completed', 'approved', 'sent'].includes(workOrder.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Tamamlanmış veya onaylanmış iş emirleri düzenlenemez'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE work_orders 
       SET customer_company_id = $1, scheduled_date = $2, notes = $3
       WHERE id = $4 AND company_id = $5
       RETURNING *`,
      [customerCompanyId, scheduledDate || null, notes || null, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri güncellenirken bir hata oluştu'
      }
    });
  }
};

const assignTechnicians = async (req, res) => {
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
    const { technicianIds } = req.body;
    const companyId = req.user.company_id;
    
    // Check if work order exists and belongs to the same company
    const existingWorkOrder = await pool.query(
      'SELECT id FROM work_orders WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingWorkOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }
    
    // Verify all technicians belong to the same company
    const technicianCheck = await pool.query(
      'SELECT id FROM technicians WHERE id = ANY($1) AND company_id = $2 AND is_active = true',
      [technicianIds, companyId]
    );
    
    if (technicianCheck.rows.length !== technicianIds.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Bir veya daha fazla teknisyen bulunamadı'
        }
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove existing assignments
      await client.query(
        'DELETE FROM work_order_assignments WHERE work_order_id = $1',
        [id]
      );
      
      // Add new assignments
      for (const technicianId of technicianIds) {
        await client.query(
          'INSERT INTO work_order_assignments (work_order_id, technician_id) VALUES ($1, $2)',
          [id, technicianId]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Teknisyenler başarıyla atandı'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Assign technicians error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teknisyen ataması yapılırken bir hata oluştu'
      }
    });
  }
};

const updateWorkOrderStatus = async (req, res) => {
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
    const { status } = req.body;
    const companyId = req.user.company_id;
    
    // Check if work order exists and belongs to the same company
    const existingWorkOrder = await pool.query(
      'SELECT id, status as current_status FROM work_orders WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingWorkOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }
    
    const validStatuses = ['not_started', 'in_progress', 'completed', 'approved', 'sent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz durum'
        }
      });
    }
    // Simple transition/business rules
    // completed: all inspections must be completed
    if (status === 'completed') {
      const pendingCount = await pool.query(
        `SELECT COUNT(*) AS cnt FROM inspections WHERE work_order_id = $1 AND status <> 'completed'`,
        [id]
      );
      if (parseInt(pendingCount.rows[0].cnt) > 0) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Tüm muayeneler tamamlanmadan iş emri tamamlanamaz' }
        });
      }
    }
    // approved: must be completed first
    if (status === 'approved') {
      const wo = existingWorkOrder.rows[0];
      if (wo.current_status !== 'completed') {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'İş emri onaylanmadan önce tamamlanmış olmalıdır' }
        });
      }
    }
    // sent: must be approved first
    if (status === 'sent') {
      const wo = existingWorkOrder.rows[0];
      if (wo.current_status !== 'approved') {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'İş emri gönderilmeden önce onaylanmış olmalıdır' }
        });
      }
    }

    const result = await pool.query(
      `UPDATE work_orders 
       SET status = $1
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [status, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'İş emri durumu güncellendi'
    });
    
  } catch (error) {
    console.error('Update work order status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri durumu güncellenirken bir hata oluştu'
      }
    });
  }
};

const deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if work order exists and belongs to the same company
    const existingWorkOrder = await pool.query(
      'SELECT id, status FROM work_orders WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingWorkOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }
    
    const workOrder = existingWorkOrder.rows[0];
    if (['completed', 'approved', 'sent'].includes(workOrder.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Tamamlanmış veya onaylanmış iş emirleri silinemez'
        }
      });
    }
    
    // Check if work order has inspections with data
    const inspectionCheck = await pool.query(
      `SELECT COUNT(*) as count FROM inspections 
       WHERE work_order_id = $1 AND (
         inspection_data != '{}' OR 
         photo_urls != '[]' OR 
         status IN ('completed', 'approved')
       )`,
      [id]
    );
    
    if (parseInt(inspectionCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Muayene verileri olan iş emirleri silinemez'
        }
      });
    }
    
    // Start transaction to delete work order and related data
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete inspections
      await client.query('DELETE FROM inspections WHERE work_order_id = $1', [id]);
      
      // Delete assignments
      await client.query('DELETE FROM work_order_assignments WHERE work_order_id = $1', [id]);
      
      // Delete work order
      await client.query('DELETE FROM work_orders WHERE id = $1 AND company_id = $2', [id, companyId]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'İş emri başarıyla silindi'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri silinirken bir hata oluştu'
      }
    });
  }
};

const createWorkOrderValidation = [
  body('customerCompanyId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir müşteri firma ID\'si gereklidir'),
  body('assignedTechnicians')
    .optional()
    .isArray()
    .withMessage('Atanan teknisyenler dizi formatında olmalıdır'),
  body('assignedTechnicians.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli teknisyen ID\'leri gereklidir'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir tarih formatı kullanınız'),
  body('equipmentIds')
    .optional()
    .isArray()
    .withMessage('Ekipmanlar dizi formatında olmalıdır'),
  body('equipmentIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli ekipman ID\'leri gereklidir'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notlar maksimum 2000 karakter olabilir')
];

const updateWorkOrderValidation = [
  body('customerCompanyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli bir müşteri firma ID\'si gereklidir'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir tarih formatı kullanınız'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notlar maksimum 2000 karakter olabilir')
];

const assignTechniciansValidation = [
  body('technicianIds')
    .isArray({ min: 1 })
    .withMessage('En az bir teknisyen gereklidir'),
  body('technicianIds.*')
    .isInt({ min: 1 })
    .withMessage('Geçerli teknisyen ID\'leri gereklidir')
];

const updateStatusValidation = [
  body('status')
    .isIn(['not_started', 'in_progress', 'completed', 'approved', 'sent'])
    .withMessage('Geçerli bir durum seçiniz')
];

module.exports = {
  getWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  assignTechnicians,
  updateWorkOrderStatus,
  deleteWorkOrder,
  createWorkOrderValidation,
  updateWorkOrderValidation,
  assignTechniciansValidation,
  updateStatusValidation
};
