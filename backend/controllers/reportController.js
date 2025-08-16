const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const pdf = require('html-pdf');
const crypto = require('crypto');

const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
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
       WHERE r.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor bilgileri alınırken bir hata oluştu'
      }
    });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { signed = 'false' } = req.query;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
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
       WHERE r.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }
    
    const report = result.rows[0];
    let pdfBase64;
    
    if (signed === 'true' && report.is_signed && report.signed_pdf_base64) {
      pdfBase64 = report.signed_pdf_base64;
    } else if (report.unsigned_pdf_base64) {
      pdfBase64 = report.unsigned_pdf_base64;
    } else {
      // Generate PDF if not exists
      const html = generateReportHTML(report);
      pdfBase64 = await generatePDFFromHTML(html);
      
      // Save generated PDF
      await pool.query(
        'UPDATE reports SET unsigned_pdf_base64 = $1 WHERE id = $2',
        [pdfBase64, id]
      );
    }
    
    if (!pdfBase64) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'PDF rapor bulunamadı'
        }
      });
    }
    
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const filename = `${report.equipment_name}_${report.work_order_number}_${report.inspection_date}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor indirilirken bir hata oluştu'
      }
    });
  }
};

const signReport = async (req, res) => {
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
    const { pin, signedPdfBase64 } = req.body;
    const companyId = req.user.company_id;
    const userId = req.user.id;
    
    // Verify user's e-signature PIN
    const userCheck = await pool.query(
      'SELECT e_signature_pin FROM technicians WHERE id = $1 AND company_id = $2',
      [userId, companyId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].e_signature_pin !== pin) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Geçersiz e-imza PIN\'i'
        }
      });
    }
    
    // Check if report exists and can be signed
    const reportCheck = await pool.query(
      `SELECT r.*, i.status as inspection_status, wo.company_id
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE r.id = $1`,
      [id]
    );
    
    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }
    
    const report = reportCheck.rows[0];
    
    if (report.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu rapora erişim yetkiniz yok'
        }
      });
    }
    
    if (report.inspection_status !== 'completed') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece tamamlanmış muayenelerin raporları imzalanabilir'
        }
      });
    }
    
    if (report.is_signed) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Rapor zaten imzalanmış'
        }
      });
    }
    
    const result = await pool.query(
      `UPDATE reports 
       SET signed_pdf_base64 = $1, is_signed = true, signed_at = CURRENT_TIMESTAMP, signed_by = $2
       WHERE id = $3
       RETURNING *`,
      [signedPdfBase64, userId, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Rapor başarıyla imzalandı'
    });
    
  } catch (error) {
    console.error('Sign report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor imzalanırken bir hata oluştu'
      }
    });
  }
};

const sendReport = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const reportResult = await pool.query(
      `SELECT r.*, cc.email as customer_email, cc.name as customer_name,
              e.name as equipment_name, wo.work_order_number
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       WHERE r.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }
    
    const report = reportResult.rows[0];
    
    if (!report.is_signed) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece imzalanmış raporlar gönderilebilir'
        }
      });
    }
    
    // Update sent timestamp
    await pool.query(
      'UPDATE reports SET sent_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    
    // Here you would integrate with email service
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Rapor başarıyla gönderildi',
      data: {
        customerEmail: report.customer_email,
        customerName: report.customer_name,
        equipmentName: report.equipment_name,
        workOrderNumber: report.work_order_number
      }
    });
    
  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor gönderilirken bir hata oluştu'
      }
    });
  }
};

const getPublicReport = async (req, res) => {
  try {
    const { qrToken } = req.params;
    
    const result = await pool.query(
      `SELECT r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
              e.name as equipment_name, e.type as equipment_type,
              t.name as technician_name, t.surname as technician_surname,
              wo.work_order_number, cc.name as customer_name,
              comp.name as company_name, comp.contact as company_contact
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN equipment e ON i.equipment_id = e.id
       JOIN technicians t ON i.technician_id = t.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       JOIN companies comp ON wo.company_id = comp.id
       WHERE r.qr_token = $1 AND r.is_signed = true`,
      [qrToken]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı veya henüz imzalanmamış'
        }
      });
    }
    
    // Remove sensitive data for public access
    const report = result.rows[0];
    delete report.signed_pdf_base64;
    delete report.unsigned_pdf_base64;
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Get public report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor görüntülenirken bir hata oluştu'
      }
    });
  }
};

const getSigningData = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    
    const result = await pool.query(
      `SELECT r.unsigned_pdf_base64, i.status as inspection_status, wo.company_id
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE r.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }
    
    const report = result.rows[0];
    
    if (report.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu rapora erişim yetkiniz yok'
        }
      });
    }
    
    if (report.inspection_status !== 'completed') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Sadece tamamlanmış muayenelerin raporları imzalanabilir'
        }
      });
    }
    
    if (!report.unsigned_pdf_base64) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'İmzalanacak PDF bulunamadı'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        pdfBase64: report.unsigned_pdf_base64
      }
    });
    
  } catch (error) {
    console.error('Get signing data error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'İmzalama verileri alınırken bir hata oluştu'
      }
    });
  }
};

// Helper function to generate HTML from inspection data
const generateReportHTML = (report) => {
  const template = report.template;
  const inspectionData = report.inspection_data;
  const photos = report.photo_urls || [];
  
  let sectionsHTML = '';
  
  if (template && template.sections) {
    for (const section of template.sections) {
      sectionsHTML += `
        <div class="section">
          <h3>${section.title}</h3>
          <table class="data-table">
      `;
      
      if (section.fields) {
        for (const field of section.fields) {
          const value = inspectionData[field.name] || '-';
          if (field.type === 'photo') {
            // Handle photo fields
            const photoUrls = photos.filter(url => url.includes(field.name));
            const photoHTML = photoUrls.map(url => `<img src="${url}" alt="${field.label}" style="max-width: 200px; margin: 5px;">`).join('');
            sectionsHTML += `
              <tr>
                <td class="label">${field.label}:</td>
                <td class="value">${photoHTML || '-'}</td>
              </tr>
            `;
          } else if (field.type === 'table' && Array.isArray(value)) {
            // Handle table fields
            let tableHTML = '<table class="inner-table">';
            if (field.columns && value.length > 0) {
              tableHTML += '<tr>';
              for (const column of field.columns) {
                tableHTML += `<th>${column.label}</th>`;
              }
              tableHTML += '</tr>';
              
              for (const row of value) {
                tableHTML += '<tr>';
                for (const column of field.columns) {
                  tableHTML += `<td>${row[column.name] || '-'}</td>`;
                }
                tableHTML += '</tr>';
              }
            }
            tableHTML += '</table>';
            
            sectionsHTML += `
              <tr>
                <td class="label">${field.label}:</td>
                <td class="value">${tableHTML}</td>
              </tr>
            `;
          } else {
            sectionsHTML += `
              <tr>
                <td class="label">${field.label}:</td>
                <td class="value">${Array.isArray(value) ? value.join(', ') : value}</td>
              </tr>
            `;
          }
        }
      }
      
      sectionsHTML += `
          </table>
        </div>
      `;
    }
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Muayene Raporu</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #333; }
        .company-info { margin-bottom: 20px; }
        .equipment-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section h3 { background: #333; color: white; padding: 10px; margin: 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-table td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
        .label { font-weight: bold; background: #f9f9f9; width: 30%; }
        .value { width: 70%; }
        .inner-table { width: 100%; border-collapse: collapse; }
        .inner-table th, .inner-table td { padding: 5px; border: 1px solid #ccc; text-align: left; }
        .inner-table th { background: #e9e9e9; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        .qr-section { text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${report.company_name}</h1>
        <h2>MUAYENE RAPORU</h2>
      </div>
      
      <div class="company-info">
        <table class="data-table">
          <tr>
            <td class="label">Müşteri Firma:</td>
            <td class="value">${report.customer_name}</td>
          </tr>
          <tr>
            <td class="label">İş Emri No:</td>
            <td class="value">${report.work_order_number}</td>
          </tr>
          <tr>
            <td class="label">Muayene Tarihi:</td>
            <td class="value">${new Date(report.inspection_date).toLocaleDateString('tr-TR')}</td>
          </tr>
          <tr>
            <td class="label">Muayene Saati:</td>
            <td class="value">${report.start_time} - ${report.end_time}</td>
          </tr>
          <tr>
            <td class="label">Muayene Teknisyeni:</td>
            <td class="value">${report.technician_name} ${report.technician_surname}</td>
          </tr>
        </table>
      </div>
      
      <div class="equipment-info">
        <h3>EKIPMAN BİLGİLERİ</h3>
        <table class="data-table">
          <tr>
            <td class="label">Ekipman Adı:</td>
            <td class="value">${report.equipment_name}</td>
          </tr>
          <tr>
            <td class="label">Ekipman Türü:</td>
            <td class="value">${report.equipment_type}</td>
          </tr>
        </table>
      </div>
      
      ${sectionsHTML}
      
      <div class="qr-section">
        <p><strong>Rapor Doğrulama:</strong></p>
        <p>QR Token: ${report.qr_token}</p>
        <p>Bu raporu doğrulamak için QR kodu okutunuz.</p>
      </div>
      
      <div class="footer">
        <p>Bu rapor ${report.company_name} tarafından oluşturulmuştur.</p>
        <p>Rapor Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </body>
    </html>
  `;
};

// Helper function to convert HTML to PDF
const generatePDFFromHTML = (html) => {
  return new Promise((resolve, reject) => {
    const options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      header: {
        height: '15mm'
      },
      footer: {
        height: '15mm'
      }
    };
    
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const base64 = buffer.toString('base64');
        resolve(base64);
      }
    });
  });
};

const signReportValidation = [
  body('pin')
    .notEmpty()
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('E-imza PIN\'i 4-10 karakter arasında olmalıdır'),
  body('signedPdfBase64')
    .notEmpty()
    .withMessage('İmzalanmış PDF gereklidir')
];

module.exports = {
  getReport,
  downloadReport,
  signReport,
  sendReport,
  getPublicReport,
  getSigningData,
  signReportValidation
};