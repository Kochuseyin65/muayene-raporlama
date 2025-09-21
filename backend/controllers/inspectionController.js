const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const getInspections = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { 
      page = 1, 
      limit = 20, 
      workOrderId, 
      technicianId, 
      status, 
      dateFrom, 
      dateTo,
      equipmentType,
      mine
    } = req.query;

    const offset = (page - 1) * limit;

    const normalizeId = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const mineSelected = typeof mine === 'string' && ['true', '1', 'yes'].includes(mine.toLowerCase());
    const hasFullPermission = (req.user.permissions || []).includes('viewInspections');
    const technicianFilterId = mineSelected || !hasFullPermission ? req.user.id : normalizeId(technicianId);

    let query = `
      SELECT i.*, e.name as equipment_name, e.type as equipment_type,
             t.name as technician_name, t.surname as technician_surname,
             wo.work_order_number, cc.name as customer_name,
             r.id as report_id, r.is_signed, r.qr_token, r.report_style
      FROM inspections i
      JOIN equipment e ON i.equipment_id = e.id
      JOIN technicians t ON i.technician_id = t.id
      JOIN work_orders wo ON i.work_order_id = wo.id
      JOIN customer_companies cc ON wo.customer_company_id = cc.id
      LEFT JOIN reports r ON i.id = r.inspection_id
      WHERE wo.company_id = $1
    `;
    let params = [companyId];
    
    if (workOrderId) {
      query += ` AND i.work_order_id = $${params.length + 1}`;
      params.push(workOrderId);
    }
    
    if (technicianFilterId) {
      query += ` AND i.technician_id = $${params.length + 1}`;
      params.push(technicianFilterId);
    }
    
    if (status) {
      query += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (equipmentType) {
      query += ` AND e.type = $${params.length + 1}`;
      params.push(equipmentType);
    }
    
    if (dateFrom) {
      query += ` AND i.inspection_date >= $${params.length + 1}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND i.inspection_date <= $${params.length + 1}`;
      params.push(dateTo);
    }
    
    query += ` ORDER BY i.inspection_date DESC, i.start_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM inspections i
      JOIN equipment e ON i.equipment_id = e.id
      JOIN work_orders wo ON i.work_order_id = wo.id
      WHERE wo.company_id = $1
    `;
    let countParams = [companyId];
    
    // Apply same filters for count
    if (workOrderId) {
      countQuery += ` AND i.work_order_id = $${countParams.length + 1}`;
      countParams.push(workOrderId);
    }
    
    if (technicianFilterId) {
      countQuery += ` AND i.technician_id = $${countParams.length + 1}`;
      countParams.push(technicianFilterId);
    }
    
    if (status) {
      countQuery += ` AND i.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    if (equipmentType) {
      countQuery += ` AND e.type = $${countParams.length + 1}`;
      countParams.push(equipmentType);
    }
    
    if (dateFrom) {
      countQuery += ` AND i.inspection_date >= $${countParams.length + 1}`;
      countParams.push(dateFrom);
    }
    
    if (dateTo) {
      countQuery += ` AND i.inspection_date <= $${countParams.length + 1}`;
      countParams.push(dateTo);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        inspections: result.rows,
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
    console.error('Get inspections error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayeneler listelenirken bir hata oluştu'
      }
    });
  }
};

const approveInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const inspectionCheck = await pool.query(
      `SELECT i.*, wo.company_id
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE i.id = $1`,
      [id]
    );

    if (inspectionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Muayene bulunamadı' } });
    }
    const inspection = inspectionCheck.rows[0];
    if (inspection.company_id !== companyId) {
      return res.status(403).json({ success: false, error: { code: 'PERMISSION_DENIED', message: 'Bu muayeneye erişim yetkiniz yok' } });
    }
    if (inspection.status !== 'completed') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Sadece tamamlanmış muayeneler onaylanabilir' } });
    }

    const result = await pool.query(
      `UPDATE inspections SET status = 'approved' WHERE id = $1 RETURNING *`,
      [id]
    );

    return res.json({ success: true, data: result.rows[0], message: 'Muayene onaylandı' });
  } catch (error) {
    console.error('Approve inspection error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Muayene onaylanırken bir hata oluştu' } });
  }
};

const getInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT i.*, e.name as equipment_name, e.type as equipment_type, e.template,
              t.name as technician_name, t.surname as technician_surname,
              wo.work_order_number, wo.scheduled_date as work_order_scheduled_date,
              cc.name as customer_name, cc.email as customer_email,
              r.id as report_id, r.unsigned_pdf_path, r.signed_pdf_path, 
              r.is_signed, r.signed_at, r.qr_token, r.report_style
       FROM inspections i
       JOIN equipment e ON i.equipment_id = e.id
       JOIN technicians t ON i.technician_id = t.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       LEFT JOIN reports r ON i.id = r.inspection_id
       WHERE i.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Muayene bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get inspection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayene bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const updateInspection = async (req, res) => {
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
    const { inspectionData, status, inspectionDate, startTime, endTime } = req.body;
    const companyId = req.user.company_id;
    const userId = req.user.id;
    
    // Check if inspection exists and user has permission
    const inspectionCheck = await pool.query(
      `SELECT i.*, wo.company_id 
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (inspectionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Muayene bulunamadı'
        }
      });
    }
    
    const inspection = inspectionCheck.rows[0];
    
    if (inspection.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu muayeneye erişim yetkiniz yok'
        }
      });
    }
    
    // Only assigned technician or company admin can edit
    const userPermissions = req.user.permissions || [];
    if (inspection.technician_id !== userId && !userPermissions.includes('companyAdmin')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Sadece atanmış teknisyen veya firma admini muayeneyi düzenleyebilir'
        }
      });
    }
    
    // Check for time slot conflicts if time is being changed
    if (inspectionDate || startTime || endTime) {
      const newDate = inspectionDate || inspection.inspection_date;
      const newStartTime = startTime || inspection.start_time;
      const newEndTime = endTime || inspection.end_time;
      const technicianId = inspection.technician_id;
      
      const conflictCheck = await pool.query(
        `SELECT id FROM inspections 
         WHERE technician_id = $1 
         AND inspection_date = $2 
         AND id != $3
         AND (
           (start_time <= $4 AND end_time > $4) OR
           (start_time < $5 AND end_time >= $5) OR
           (start_time >= $4 AND end_time <= $5)
         )`,
        [technicianId, newDate, id, newStartTime, newEndTime]
      );
      
      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Bu saat aralığında başka bir muayene mevcut'
          }
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE inspections 
       SET inspection_data = $1, status = $2, inspection_date = $3, start_time = $4, end_time = $5
       WHERE id = $6
       RETURNING *`,
      [
        JSON.stringify(inspectionData || inspection.inspection_data),
        status || inspection.status,
        inspectionDate || inspection.inspection_date,
        startTime || inspection.start_time,
        endTime || inspection.end_time,
        id
      ]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayene güncellenirken bir hata oluştu'
      }
    });
  }
};

const saveInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Get inspection details with template
    const inspectionResult = await pool.query(
      `SELECT i.*, e.template, wo.company_id,
              cc.name as customer_name, cc.authorized_person,
              comp.name as company_name, comp.logo_url
       FROM inspections i
       JOIN equipment e ON i.equipment_id = e.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       JOIN companies comp ON wo.company_id = comp.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (inspectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Muayene bulunamadı'
        }
      });
    }
    
    const inspection = inspectionResult.rows[0];
    
    if (inspection.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu muayeneye erişim yetkiniz yok'
        }
      });
    }
    
    // Generate QR token
    const qrToken = require('crypto').randomBytes(16).toString('hex');

    const templateReportStyle = inspection?.template?.settings?.reportStyle;
    const templateScale = typeof templateReportStyle?.scale === 'string'
      ? templateReportStyle.scale
      : 'medium';
    const defaultReportStyle = {
      ...(templateReportStyle && typeof templateReportStyle === 'object' ? templateReportStyle : {}),
      scale: templateScale
    };
    
    // Check if report already exists
    const existingReport = await pool.query(
      'SELECT id FROM reports WHERE inspection_id = $1',
      [id]
    );
    
    let reportResult;
    if (existingReport.rows.length > 0) {
      // Update existing report
      reportResult = await pool.query(
        `UPDATE reports 
         SET qr_token = $1,
             unsigned_pdf_path = NULL,
             signed_pdf_path = NULL,
             is_signed = false,
             signed_at = NULL,
             signed_by = NULL,
             report_style = CASE
               WHEN report_style IS NULL OR report_style = '{}'::jsonb THEN $3::jsonb
               ELSE report_style
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE inspection_id = $2
         RETURNING *`,
        [qrToken, id, JSON.stringify(defaultReportStyle)]
      );
    } else {
      // Create new report
      reportResult = await pool.query(
        `INSERT INTO reports (inspection_id, qr_token, report_style) 
         VALUES ($1, $2, $3::jsonb) 
         RETURNING *`,
        [id, qrToken, JSON.stringify(defaultReportStyle)]
      );
    }
    
    res.json({
      success: true,
      data: {
        inspection: inspection,
        report: reportResult.rows[0]
      },
      message: 'Muayene başarıyla kaydedildi'
    });
    
  } catch (error) {
    console.error('Save inspection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayene kaydedilirken bir hata oluştu'
      }
    });
  }
};

const completeInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const userId = req.user.id;
    
    // Check if inspection exists and validate completion
    const inspectionCheck = await pool.query(
      `SELECT i.*, wo.company_id, e.template
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN equipment e ON i.equipment_id = e.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (inspectionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Muayene bulunamadı'
        }
      });
    }
    
    const inspection = inspectionCheck.rows[0];
    
    if (inspection.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu muayeneye erişim yetkiniz yok'
        }
      });
    }
    
    // Only assigned technician can complete
    if (inspection.technician_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Sadece atanmış teknisyen muayeneyi tamamlayabilir'
        }
      });
    }
    
    if (inspection.status === 'completed') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Muayene zaten tamamlanmış'
        }
      });
    }
    
    // Validate that all required fields are filled
    const template = inspection.template;
    const inspectionData = inspection.inspection_data;
    
    if (!validateInspectionCompletion(template, inspectionData)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tüm zorunlu alanlar doldurulmamış'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE inspections 
       SET status = 'completed'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    // Invalidate any previously generated PDFs/signatures for this inspection's report
    await pool.query(
      `UPDATE reports 
       SET unsigned_pdf_path = NULL,
           signed_pdf_path = NULL,
           is_signed = false,
           signed_at = NULL,
           signed_by = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE inspection_id = $1`,
      [id]
    );
    
    // Auto-generate unsigned PDF after completion (file-based)
    try {
      const reportData = await pool.query(
        `SELECT r.id as report_id, r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
                e.name as equipment_name, e.type as equipment_type, e.template,
                t.name as technician_name, t.surname as technician_surname,
                wo.work_order_number, cc.name as customer_name,
                comp.name as company_name, comp.logo_url
         FROM reports r
         JOIN inspections i ON r.inspection_id = i.id
         JOIN equipment e ON i.equipment_id = e.id
         JOIN technicians t ON i.technician_id = t.id
         JOIN work_orders wo ON i.work_order_id = wo.id
         JOIN customer_companies cc ON wo.customer_company_id = cc.id
         JOIN companies comp ON wo.company_id = comp.id
         WHERE r.inspection_id = $1`,
        [id]
      );
      if (reportData.rows.length > 0) {
        const reportRow = reportData.rows[0];
        const { generateReportHTML } = require('./reportController');
        const { generatePDFBufferFromHTML } = require('../utils/pdfGenerator');
        const { unsignedPdfPath, writeFileAtomic } = require('../utils/storage');
        const html = generateReportHTML(reportRow);
        const buf = await generatePDFBufferFromHTML(html);
        const out = unsignedPdfPath(reportRow.id);
        await writeFileAtomic(out, buf);
        await pool.query('UPDATE reports SET unsigned_pdf_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [out, reportRow.id]);
      }
    } catch (e) {
      // Swallow PDF generation errors to not block completion
      console.error('Auto-generate PDF after completion failed:', e);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Muayene başarıyla tamamlandı'
    });
    
  } catch (error) {
    console.error('Complete inspection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayene tamamlanırken bir hata oluştu'
      }
    });
  }
};

const uploadInspectionPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'En az bir fotoğraf gereklidir'
        }
      });
    }
    
    // Check if inspection exists
    const inspectionCheck = await pool.query(
      `SELECT i.*, wo.company_id
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (inspectionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Muayene bulunamadı'
        }
      });
    }
    
    const inspection = inspectionCheck.rows[0];
    
    if (inspection.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu muayeneye erişim yetkiniz yok'
        }
      });
    }
    
    // Process uploaded files
    const photoUrls = [];
    for (const file of req.files) {
      // In a real implementation, you would upload to cloud storage
      // For now, we'll just store the file path
      const photoUrl = `/uploads/inspections/${id}/${file.filename}`;
      photoUrls.push(photoUrl);
    }
    
    // Get existing photo URLs
    const existingPhotos = inspection.photo_urls || [];
    const allPhotos = [...existingPhotos, ...photoUrls];
    
    // Optionally map uploaded photos to a specific template field
    let updatedInspectionData = inspection.inspection_data || {};
    const bodyFieldName = req.body?.fieldName || req.body?.fieldNames;
    if (bodyFieldName) {
      const fieldNames = Array.isArray(bodyFieldName) ? bodyFieldName : photoUrls.map(() => bodyFieldName);
      fieldNames.forEach((fname, idx) => {
        if (typeof fname === 'string' && fname.trim()) {
          const url = photoUrls[idx] || photoUrls[photoUrls.length - 1];
          if (!Array.isArray(updatedInspectionData[fname])) {
            updatedInspectionData[fname] = [];
          }
          updatedInspectionData[fname].push(url);
        }
      });
    }

    const result = await pool.query(
      `UPDATE inspections 
       SET photo_urls = $1, inspection_data = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(allPhotos), JSON.stringify(updatedInspectionData), id]
    );
    
    res.json({
      success: true,
      data: {
        inspection: result.rows[0],
        uploadedPhotos: photoUrls
      },
      message: 'Fotoğraflar başarıyla yüklendi'
    });
    
  } catch (error) {
    console.error('Upload inspection photos error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Fotoğraflar yüklenirken bir hata oluştu'
      }
    });
  }
};

const checkTimeSlotAvailability = async (req, res) => {
  try {
    const { technicianId, date, startTime, endTime } = req.query;
    const companyId = req.user.company_id;
    
    if (!technicianId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Teknisyen ID, tarih, başlangıç ve bitiş saati gereklidir'
        }
      });
    }
    
    // Verify technician belongs to the same company
    const technicianCheck = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2 AND is_active = true',
      [technicianId, companyId]
    );
    
    if (technicianCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }
    
    // Check for conflicts
    const conflictCheck = await pool.query(
      `SELECT i.id, i.start_time, i.end_time, e.name as equipment_name
       FROM inspections i
       JOIN equipment e ON i.equipment_id = e.id
       WHERE i.technician_id = $1 
       AND i.inspection_date = $2 
       AND (
         (i.start_time <= $3 AND i.end_time > $3) OR
         (i.start_time < $4 AND i.end_time >= $4) OR
         (i.start_time >= $3 AND i.end_time <= $4)
       )`,
      [technicianId, date, startTime, endTime]
    );
    
    const isAvailable = conflictCheck.rows.length === 0;
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflicts: conflictCheck.rows
      }
    });
    
  } catch (error) {
    console.error('Check time slot availability error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Saat kontrolü yapılırken bir hata oluştu'
      }
    });
  }
};

// Helper function to validate inspection completion
const validateInspectionCompletion = (template, inspectionData) => {
  try {
    if (!template || !template.sections) {
      return true; // No template means no validation needed
    }
    
    for (const section of template.sections) {
      if (!section.fields) continue;
      
      for (const field of section.fields) {
        if (field.required) {
          const value = inspectionData[field.name];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};

const updateInspectionValidation = [
  body('inspectionData')
    .optional()
    .isObject()
    .withMessage('Muayene verileri obje formatında olmalıdır'),
  body('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed', 'approved'])
    .withMessage('Geçerli bir durum seçiniz'),
  body('inspectionDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir tarih formatı kullanınız'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Geçerli bir saat formatı kullanınız (HH:MM)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Geçerli bir saat formatı kullanınız (HH:MM)')
];

const createInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Girilen veriler geçersiz',
          details: errors.array()
        }
      });
    }

    const { workOrderId, equipmentId, technicianId, inspectionDate, startTime, endTime } = req.body;
    const companyId = req.user.company_id;

    // Verify work order exists and belongs to company
    const workOrderCheck = await pool.query(
      'SELECT id FROM work_orders WHERE id = $1 AND company_id = $2',
      [workOrderId, companyId]
    );

    if (workOrderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İş emri bulunamadı'
        }
      });
    }

    // Verify equipment exists and belongs to company
    const equipmentCheck = await pool.query(
      'SELECT id FROM equipment WHERE id = $1 AND company_id = $2 AND is_active = true',
      [equipmentId, companyId]
    );

    if (equipmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ekipman bulunamadı'
        }
      });
    }

    // Verify technician exists and belongs to company
    const technicianCheck = await pool.query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2 AND is_active = true',
      [technicianId, companyId]
    );

    if (technicianCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teknisyen bulunamadı'
        }
      });
    }

    // Check time slot availability
    const conflictCheck = await pool.query(
      `SELECT id FROM inspections 
       WHERE technician_id = $1 
       AND inspection_date = $2 
       AND (
         (start_time <= $3 AND end_time > $3) OR
         (start_time < $4 AND end_time >= $4) OR
         (start_time >= $3 AND end_time <= $4)
       )`,
      [technicianId, inspectionDate, startTime, endTime]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu zaman diliminde teknisyenin başka bir muayenesi var'
        }
      });
    }

    // Create inspection
    const generateInspectionNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INSP-${timestamp}${random}`;
    };

    const result = await pool.query(
      `INSERT INTO inspections 
       (work_order_id, equipment_id, technician_id, inspection_date, start_time, end_time, inspection_data, inspection_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [workOrderId, equipmentId, technicianId, inspectionDate, startTime, endTime, '{}', generateInspectionNumber()]
    );

    const inspection = result.rows[0];

    // Ensure a report row exists for this inspection with a QR token
    const qrToken = require('crypto').randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO reports (inspection_id, qr_token)
       VALUES ($1, $2)
       ON CONFLICT (inspection_id) DO UPDATE SET qr_token = EXCLUDED.qr_token, updated_at = CURRENT_TIMESTAMP`,
      [inspection.id, qrToken]
    );

    res.status(201).json({
      success: true,
      data: inspection,
      message: 'Muayene başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Muayene oluşturulurken bir hata oluştu'
      }
    });
  }
};

const createInspectionValidation = [
  body('workOrderId')
    .notEmpty()
    .isInt()
    .withMessage('Geçerli bir iş emri ID\'si gereklidir'),
  body('equipmentId')
    .notEmpty()
    .isInt()
    .withMessage('Geçerli bir ekipman ID\'si gereklidir'),
  body('technicianId')
    .notEmpty()
    .isInt()
    .withMessage('Geçerli bir teknisyen ID\'si gereklidir'),
  body('inspectionDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Geçerli bir muayene tarihi gereklidir'),
  body('startTime')
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Geçerli bir başlangıç saati gereklidir (HH:MM)'),
  body('endTime')
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Geçerli bir bitiş saati gereklidir (HH:MM)')
];

module.exports = {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  saveInspection,
  completeInspection,
  approveInspection,
  uploadInspectionPhotos,
  checkTimeSlotAvailability,
  createInspectionValidation,
  updateInspectionValidation
};
