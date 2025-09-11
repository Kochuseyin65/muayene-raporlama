const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const crypto = require('crypto');

const generateOfferNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `OFFER-${timestamp}${random}`;
};

const generateTrackingToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateInspectionNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INSP-${timestamp}${random}`;
};

const getOffers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { page = 1, limit = 20, status, search, customerCompanyId } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*, cc.name as customer_name, cc.email as customer_email,
             t1.name as created_by_name, t1.surname as created_by_surname,
             t2.name as approved_by_name, t2.surname as approved_by_surname
      FROM offers o
      JOIN customer_companies cc ON o.customer_company_id = cc.id
      JOIN technicians t1 ON o.created_by = t1.id
      LEFT JOIN technicians t2 ON o.approved_by = t2.id
      WHERE o.company_id = $1
    `;
    let params = [companyId];
    
    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (o.offer_number ILIKE $${params.length + 1} OR cc.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (customerCompanyId) {
      query += ` AND o.customer_company_id = $${params.length + 1}`;
      params.push(customerCompanyId);
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM offers o 
      JOIN customer_companies cc ON o.customer_company_id = cc.id 
      WHERE o.company_id = $1
    `;
    let countParams = [companyId];
    
    if (status) {
      countQuery += ` AND o.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ` AND (o.offer_number ILIKE $${countParams.length + 1} OR cc.name ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    if (customerCompanyId) {
      countQuery += ` AND o.customer_company_id = $${countParams.length + 1}`;
      countParams.push(customerCompanyId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        offers: result.rows,
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
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklifler listelenirken bir hata oluştu'
      }
    });
  }
};

const getOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT o.*, cc.name as customer_name, cc.email as customer_email,
              cc.tax_number as customer_tax_number, cc.address as customer_address,
              cc.contact as customer_contact, cc.authorized_person as customer_authorized_person,
              t1.name as created_by_name, t1.surname as created_by_surname,
              t2.name as approved_by_name, t2.surname as approved_by_surname
       FROM offers o
       JOIN customer_companies cc ON o.customer_company_id = cc.id
       JOIN technicians t1 ON o.created_by = t1.id
       LEFT JOIN technicians t2 ON o.approved_by = t2.id
       WHERE o.id = $1 AND o.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const createOffer = async (req, res) => {
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
    
    const { customerCompanyId, items, notes } = req.body;
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
    
    // Validate items and calculate total
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'En az bir teklif kalemi gereklidir'
        }
      });
    }
    
    let totalAmount = 0;
    for (const item of items) {
      if (!item.equipmentId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tüm teklif kalemlerinde ekipman, miktar ve birim fiyat gereklidir'
          }
        });
      }
      
      // Verify equipment belongs to the same company
      const equipmentCheck = await pool.query(
        'SELECT id, name FROM equipment WHERE id = $1 AND company_id = $2 AND is_active = true',
        [item.equipmentId, companyId]
      );
      
      if (equipmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Ekipman bulunamadı: ${item.equipmentId}`
          }
        });
      }
      
      item.equipmentName = equipmentCheck.rows[0].name;
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unitPrice);
    }
    
    const offerNumber = generateOfferNumber();
    const trackingToken = generateTrackingToken();
    
    const result = await pool.query(
      `INSERT INTO offers (company_id, offer_number, customer_company_id, items, notes, total_amount, tracking_token, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [companyId, offerNumber, customerCompanyId, JSON.stringify(items), notes || null, totalAmount, trackingToken, createdBy]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif oluşturulurken bir hata oluştu'
      }
    });
  }
};

const updateOffer = async (req, res) => {
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
    const { customerCompanyId, items, notes } = req.body;
    const companyId = req.user.company_id;
    
    // Check if offer exists and belongs to the same company
    const existingOffer = await pool.query(
      'SELECT id, status FROM offers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingOffer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    // Check if offer can be edited
    const offer = existingOffer.rows[0];
    if (['approved', 'sent', 'viewed'].includes(offer.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Onaylanmış veya gönderilmiş teklifler düzenlenemez'
        }
      });
    }
    
    // Validate items and calculate total
    let totalAmount = 0;
    for (const item of items) {
      // Verify equipment belongs to the same company
      const equipmentCheck = await pool.query(
        'SELECT id, name FROM equipment WHERE id = $1 AND company_id = $2 AND is_active = true',
        [item.equipmentId, companyId]
      );
      
      if (equipmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Ekipman bulunamadı: ${item.equipmentId}`
          }
        });
      }
      
      item.equipmentName = equipmentCheck.rows[0].name;
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unitPrice);
    }
    
    const result = await pool.query(
      `UPDATE offers 
       SET customer_company_id = $1, items = $2, notes = $3, total_amount = $4
       WHERE id = $5 AND company_id = $6
       RETURNING *`,
      [customerCompanyId, JSON.stringify(items), notes || null, totalAmount, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif güncellenirken bir hata oluştu'
      }
    });
  }
};

const approveOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const approvedBy = req.user.id;
    
    // Check if offer exists and belongs to the same company
    const existingOffer = await pool.query(
      'SELECT id, status FROM offers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingOffer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    const offer = existingOffer.rows[0];
    if (offer.status !== 'pending') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece beklemedeki teklifler onaylanabilir'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE offers 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [approvedBy, id, companyId]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Teklif başarıyla onaylandı'
    });
    
  } catch (error) {
    console.error('Approve offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif onaylanırken bir hata oluştu'
      }
    });
  }
};

const sendOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if offer exists and belongs to the same company
    const offerResult = await pool.query(
      `SELECT o.*, cc.email as customer_email, cc.name as customer_name
       FROM offers o
       JOIN customer_companies cc ON o.customer_company_id = cc.id
       WHERE o.id = $1 AND o.company_id = $2`,
      [id, companyId]
    );
    
    if (offerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    const offer = offerResult.rows[0];
    if (offer.status !== 'approved') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece onaylanmış teklifler gönderilebilir'
        }
      });
    }
    
    // Update offer status to sent
    await pool.query(
      `UPDATE offers 
       SET status = 'sent', sent_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    
    // Here you would integrate with email service
    // For now, we'll just return success with tracking URL
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${offer.tracking_token}`;
    
    res.json({
      success: true,
      message: 'Teklif başarıyla gönderildi',
      data: {
        trackingUrl,
        customerEmail: offer.customer_email,
        customerName: offer.customer_name
      }
    });
    
  } catch (error) {
    console.error('Send offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif gönderilirken bir hata oluştu'
      }
    });
  }
};

const trackOffer = async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await pool.query(
      `SELECT o.*, cc.name as customer_name, cc.authorized_person,
              comp.name as company_name, comp.contact as company_contact
       FROM offers o
       JOIN customer_companies cc ON o.customer_company_id = cc.id
       JOIN companies comp ON o.company_id = comp.id
       WHERE o.tracking_token = $1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    const offer = result.rows[0];
    
    // Mark as viewed if not already viewed
    if (offer.status === 'sent') {
      await pool.query(
        `UPDATE offers 
         SET status = 'viewed', viewed_at = CURRENT_TIMESTAMP
         WHERE tracking_token = $1`,
        [token]
      );
      offer.status = 'viewed';
      offer.viewed_at = new Date();
    }
    
    res.json({
      success: true,
      data: offer
    });
    
  } catch (error) {
    console.error('Track offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif takibinde bir hata oluştu'
      }
    });
  }
};

// Public customer acceptance of offer via tracking token
const acceptOfferByCustomer = async (req, res) => {
  try {
    const { token } = req.params;
    const { note } = req.body || {};

    // Idempotent approval when in allowed states
    const update = await pool.query(
      `UPDATE offers
       SET status = 'approved',
           customer_decision = 'accepted',
           customer_decision_note = COALESCE($2, customer_decision_note),
           customer_decision_at = COALESCE(customer_decision_at, CURRENT_TIMESTAMP),
           viewed_at = COALESCE(viewed_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE tracking_token = $1 AND status IN ('pending','sent','viewed')
       RETURNING *`,
      [token, note || null]
    );

    if (update.rows.length > 0) {
      return res.json({ success: true, message: 'Teklif müşteri tarafından onaylandı', data: update.rows[0] });
    }

    // If not updated, fetch current to decide response
    const check = await pool.query('SELECT status, customer_decision FROM offers WHERE tracking_token = $1', [token]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Teklif bulunamadı' } });
    }
    const row = check.rows[0];
    if (row.customer_decision === 'accepted' || row.status === 'approved') {
      return res.json({ success: true, message: 'Teklif daha önce onaylanmış', data: row });
    }
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Bu teklif bu aşamada onaylanamaz' } });
  } catch (error) {
    console.error('Accept offer (public) error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Teklif onaylanırken bir hata oluştu' } });
  }
};

// Public customer decline of offer via tracking token
const declineOfferByCustomer = async (req, res) => {
  try {
    const { token } = req.params;
    const { note } = req.body || {};

    const update = await pool.query(
      `UPDATE offers
       SET status = 'rejected',
           customer_decision = 'rejected',
           customer_decision_note = COALESCE($2, customer_decision_note),
           customer_decision_at = COALESCE(customer_decision_at, CURRENT_TIMESTAMP),
           viewed_at = COALESCE(viewed_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE tracking_token = $1 AND status IN ('pending','sent','viewed')
       RETURNING *`,
      [token, note || null]
    );

    if (update.rows.length > 0) {
      return res.json({ success: true, message: 'Teklif müşteri tarafından reddedildi', data: update.rows[0] });
    }

    const check = await pool.query('SELECT status, customer_decision FROM offers WHERE tracking_token = $1', [token]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Teklif bulunamadı' } });
    }
    const row = check.rows[0];
    if (row.customer_decision === 'rejected' || row.status === 'rejected') {
      return res.json({ success: true, message: 'Teklif daha önce reddedilmiş', data: row });
    }
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Bu teklif bu aşamada reddedilemez' } });
  } catch (error) {
    console.error('Decline offer (public) error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Teklif reddedilirken bir hata oluştu' } });
  }
};

const convertToWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, notes } = req.body;
    const companyId = req.user.company_id;
    const createdBy = req.user.id;
    
    // Check if offer exists and belongs to the same company
    const offerResult = await pool.query(
      'SELECT * FROM offers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (offerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    const offer = offerResult.rows[0];
    if (!['approved', 'viewed'].includes(offer.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece onaylanmış veya görüntülenmiş teklifler iş emrine dönüştürülebilir'
        }
      });
    }
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate work order number
      const workOrderNumber = `WO-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Create work order
      const workOrderResult = await client.query(
        `INSERT INTO work_orders (company_id, work_order_number, customer_company_id, offer_id, scheduled_date, notes, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [companyId, workOrderNumber, offer.customer_company_id, offer.id, scheduledDate || null, notes || null, createdBy]
      );
      
      const workOrder = workOrderResult.rows[0];
      
      // Helper: find a free day for the given technician to avoid unique_time_slot collisions
      async function findFreeDate(techId, preferredDate) {
        const start = '09:00';
        const end = '17:00';
        let d = preferredDate ? new Date(preferredDate) : new Date();
        for (let i = 0; i < 120; i++) { // search up to 120 days ahead
          const dateStr = d.toISOString().slice(0, 10);
          const clash = await client.query(
            `SELECT 1 FROM inspections 
             WHERE technician_id = $1 AND inspection_date = $2 
               AND start_time = $3 AND end_time = $4 
             LIMIT 1`,
            [techId, dateStr, start, end]
          );
          if (clash.rows.length === 0) return dateStr;
          d.setDate(d.getDate() + 1);
        }
        // fallback: today if no slot found in 120 days
        return new Date().toISOString().slice(0, 10);
      }

      // Create inspections for each equipment in the offer
      const items = offer.items;
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const freeDate = await findFreeDate(createdBy, scheduledDate);
          await client.query(
            `INSERT INTO inspections (work_order_id, equipment_id, technician_id, inspection_date, start_time, end_time, inspection_data, inspection_number) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              workOrder.id, 
              item.equipmentId, 
              createdBy, // Temporary assignment, can be changed later
              freeDate,
              '09:00', // Default start time
              '17:00', // Default end time
              JSON.stringify({}), // Empty inspection data initially
              generateInspectionNumber()
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: workOrder,
        message: 'Teklif başarıyla iş emrine dönüştürüldü'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Convert to work order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İş emri oluşturulurken bir hata oluştu'
      }
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    // Check if offer exists and belongs to the same company
    const existingOffer = await pool.query(
      'SELECT id, status FROM offers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    
    if (existingOffer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Teklif bulunamadı'
        }
      });
    }
    
    const offer = existingOffer.rows[0];
    if (['sent', 'viewed'].includes(offer.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Gönderilmiş veya görüntülenmiş teklifler silinemez'
        }
      });
    }
    
    // Check if offer has dependent work orders
    const dependentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM work_orders WHERE offer_id = $1',
      [id]
    );
    
    if (parseInt(dependentCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bu teklife bağlı iş emirleri bulunduğu için silinemez'
        }
      });
    }
    
    await pool.query('DELETE FROM offers WHERE id = $1 AND company_id = $2', [id, companyId]);
    
    res.json({
      success: true,
      message: 'Teklif başarıyla silindi'
    });
    
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Teklif silinirken bir hata oluştu'
      }
    });
  }
};

const createOfferValidation = [
  body('customerCompanyId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir müşteri firma ID\'si gereklidir'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('En az bir teklif kalemi gereklidir'),
  body('items.*.equipmentId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir ekipman ID\'si gereklidir'),
  body('items.*.quantity')
    .isFloat({ min: 0.1 })
    .withMessage('Miktar 0\'dan büyük olmalıdır'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Birim fiyat geçerli bir sayı olmalıdır'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notlar maksimum 2000 karakter olabilir')
];

const updateOfferValidation = [
  body('customerCompanyId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir müşteri firma ID\'si gereklidir'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('En az bir teklif kalemi gereklidir'),
  body('items.*.equipmentId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir ekipman ID\'si gereklidir'),
  body('items.*.quantity')
    .isFloat({ min: 0.1 })
    .withMessage('Miktar 0\'dan büyük olmalıdır'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Birim fiyat geçerli bir sayı olmalıdır'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notlar maksimum 2000 karakter olabilir')
];

const convertToWorkOrderValidation = [
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

module.exports = {
  getOffers,
  getOffer,
  createOffer,
  updateOffer,
  approveOffer,
  sendOffer,
  trackOffer,
  acceptOfferByCustomer,
  declineOfferByCustomer,
  convertToWorkOrder,
  deleteOffer,
  createOfferValidation,
  updateOfferValidation,
  convertToWorkOrderValidation
};
