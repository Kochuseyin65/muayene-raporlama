const { body, validationResult } = require('express-validator');
const fs = require('fs');
const fsp = fs.promises;
const pool = require('../config/database');
const crypto = require('crypto');
const { generatePDFFromHTML: generatePDFFromHTMLPuppeteer, generatePDFBufferFromHTML } = require('../utils/pdfGenerator');
const path = require('path');
const QRCode = require('qrcode');
const {
  unsignedPdfPath,
  signedPdfPath,
  writeFileAtomic,
  fileExists,
  readFileBase64,
} = require('../utils/storage');

// Büyük dosyalarda RAM'e komple almadan base64 onarımını atlamak için eşik (varsayılan 30MB)
const MAX_BASE64_REPAIR_BYTES = parseInt(process.env.PDF_BASE64_REPAIR_MAX_BYTES || '31457280', 10);
const ALLOWED_REPORT_SCALES = ['small', 'medium', 'large'];
const REPORT_PUBLIC_BASE_URL = process.env.REPORT_PUBLIC_BASE_URL || 'http://localhost:5173/reports/public';

// Legacy base64 alanları kaldırıldı; normalize/backfill artık kullanılmıyor

const regenerateUnsignedPdf = async (report, htmlCache) => {
  const html = htmlCache || generateReportHTML(report);
  const buf = await generatePDFBufferFromHTML(html);
  const out = unsignedPdfPath(report.id);
  await writeFileAtomic(out, buf);
  await pool.query('UPDATE reports SET unsigned_pdf_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [out, report.id]);
  return { path: out, html };
};

const buildPublicReportUrl = (qrToken) => {
  if (!qrToken) return null;
  const base = REPORT_PUBLIC_BASE_URL.endsWith('/') ? REPORT_PUBLIC_BASE_URL.slice(0, -1) : REPORT_PUBLIC_BASE_URL;
  return `${base}/${qrToken}`;
};

const attachReportQrCode = async (report) => {
  if (!report) return report;
  const publicUrl = buildPublicReportUrl(report.qr_token);
  report.qr_public_url = publicUrl;
  if (!publicUrl) {
    report.qr_code_data_url = null;
    return report;
  }
  try {
    const dataUrl = await QRCode.toDataURL(publicUrl, { margin: 0, scale: 4 });
    report.qr_code_data_url = dataUrl;
  } catch (err) {
    console.error('QR code generation failed:', err);
    report.qr_code_data_url = null;
  }
  return report;
};

const resolvePdfPath = async (report, preferSigned, htmlCache = null) => {
  const attempts = [];
  if (preferSigned) {
    attempts.push({ key: 'signed_pdf_path', signed: true });
  }
  attempts.push({ key: 'unsigned_pdf_path', signed: false });

  for (const attempt of attempts) {
    const currentPath = report[attempt.key];
    if (currentPath && await fileExists(currentPath)) {
      return { path: currentPath, signed: attempt.signed, html: htmlCache };
    }
  }

  const unsignedAttempt = attempts.find(a => a.signed === false);
  if (unsignedAttempt) {
    const { path, html } = await regenerateUnsignedPdf(report, htmlCache);
    report.unsigned_pdf_path = path;
    return { path, signed: false, html };
  }

  return { path: null, signed: null, html: htmlCache };
};

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
    
    const row = result.rows[0];
    res.json({
      success: true,
      data: row
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
    await attachReportQrCode(report);
    const preferSigned = signed === 'true';

    let { path: finalPath, signed: deliveredSigned, html: htmlCache } = await resolvePdfPath(report, preferSigned);

    if (!finalPath || !(await fileExists(finalPath))) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'PDF rapor bulunamadı' } });
    }
    // Validate that the file is a real PDF. If not, attempt to repair/regenerate.
    const ensureValidPdf = async (filePath, canRegen, htmlForRegen) => {
      try {
        const fd = await fsp.open(filePath, 'r');
        try {
          const { buffer, bytesRead } = await fd.read(Buffer.alloc(5), 0, 5, 0);
          if (bytesRead === 5 && buffer.toString('ascii') === '%PDF-') {
            return true;
          }
        } finally {
          await fd.close();
        }
        // If file likely contains base64 of a PDF, decode and overwrite (only for reasonably small files)
        const stat = await fsp.stat(filePath).catch(() => null);
        const withinRepairLimit = !!(stat && stat.size <= MAX_BASE64_REPAIR_BYTES);
        if (withinRepairLimit) {
          const content = await fsp.readFile(filePath, 'utf8').catch(() => null);
          if (content && /^[A-Za-z0-9+/=\r\n]+$/.test(content)) {
            try {
              const decoded = Buffer.from(content.replace(/\s+/g, ''), 'base64');
              if (decoded.length > 0 && decoded.slice(0, 5).toString('ascii') === '%PDF-') {
                await writeFileAtomic(filePath, decoded);
                return true;
              }
            } catch (_) {}
          }
        }
        // As a last resort, regenerate if permitted (unsigned PDFs)
        if (canRegen && htmlForRegen) {
          try {
            const regenBuf = await generatePDFBufferFromHTML(htmlForRegen);
            await writeFileAtomic(filePath, regenBuf);
            return true;
          } catch (_) {}
        }
        return false;
      } catch (_) {
        return false;
      }
    };

    const canRegen = deliveredSigned === false; // we can only regenerate unsigned PDFs
    if (canRegen && !htmlCache) {
      htmlCache = generateReportHTML(report);
    }
    if (!(await ensureValidPdf(finalPath, canRegen, canRegen ? htmlCache : null))) {
      return res.status(500).json({ success: false, error: { code: 'INVALID_PDF', message: 'PDF dosyası geçersiz veya bozuk görünüyor' } });
    }

    const suffix = deliveredSigned ? '_signed' : '';
    const rawFilename = `${report.equipment_name}_${report.work_order_number}_${report.inspection_date}${suffix}.pdf`;
    const buildContentDisposition = (name) => {
      const safeAscii = String(name)
        .replace(/[\r\n]/g, ' ')
        .replace(/["]+/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .slice(0, 150) || 'rapor.pdf';
      const encoded = encodeURIComponent(String(name));
      return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
    };
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', buildContentDisposition(rawFilename));
    return res.sendFile(path.resolve(finalPath));
    
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
    let { pin, signedPdfBase64 } = req.body;
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
    
    // Write signed PDF to disk
    const out = signedPdfPath(id);
    await writeFileAtomic(out, Buffer.from(signedPdfBase64, 'base64'));

    const result = await pool.query(
      `UPDATE reports 
       SET signed_pdf_path = $1, is_signed = true, signed_at = CURRENT_TIMESTAMP, signed_by = $2
       WHERE id = $3
       RETURNING *`,
      [out, userId, id]
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

const updateReportStyle = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const { scale, reportStyle } = req.body || {};

    if (scale === undefined && (reportStyle === undefined || reportStyle === null)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Güncellenecek bir rapor stili belirtiniz (ör. scale)'
        }
      });
    }

    const existing = await pool.query(
      `SELECT r.id, COALESCE(r.report_style, '{}'::jsonb) AS report_style
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE r.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }

    const currentStyle = existing.rows[0].report_style && typeof existing.rows[0].report_style === 'object'
      ? existing.rows[0].report_style
      : {};

    let nextStyle = { ...currentStyle };

    if (reportStyle && typeof reportStyle === 'object' && !Array.isArray(reportStyle)) {
      nextStyle = { ...nextStyle, ...reportStyle };
    }

    if (scale !== undefined) {
      if (typeof scale !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'scale değeri metin olmalıdır'
          }
        });
      }
      nextStyle.scale = scale;
    }

    const resolvedScale = typeof nextStyle.scale === 'string'
      ? nextStyle.scale.toLowerCase()
      : undefined;

    if (!resolvedScale) {
      nextStyle.scale = 'medium';
    } else if (!ALLOWED_REPORT_SCALES.includes(resolvedScale)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Geçersiz scale değeri. Kullanılabilir değerler: ${ALLOWED_REPORT_SCALES.join(', ')}`
        }
      });
    } else {
      nextStyle.scale = resolvedScale;
    }

    const updated = await pool.query(
      `UPDATE reports
       SET report_style = $1::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, report_style`,
      [JSON.stringify(nextStyle), id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rapor bulunamadı'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        reportId: updated.rows[0].id,
        reportStyle: updated.rows[0].report_style
      }
    });
  } catch (error) {
    console.error('Update report style error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rapor stili güncellenirken bir hata oluştu'
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
       WHERE r.qr_token = $1`,
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
    
    const report = result.rows[0];
    await attachReportQrCode(report);
    
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

const downloadPublicReport = async (req, res) => {
  try {
    const { qrToken } = req.params;
    const { signed = 'true' } = req.query;
    const preferSigned = signed !== 'false';

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
       WHERE r.qr_token = $1`,
      [qrToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rapor bulunamadı' } });
    }

    const report = result.rows[0];
    await attachReportQrCode(report);
    let { path: finalPath, signed: deliveredSigned, html: htmlCache } = await resolvePdfPath(report, preferSigned);

    if (!finalPath || !(await fileExists(finalPath))) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'PDF rapor bulunamadı' } });
    }

    const ensureValidPdf = async (filePath, canRegen, htmlForRegen) => {
      try {
        const fd = await fsp.open(filePath, 'r');
        try {
          const { buffer, bytesRead } = await fd.read(Buffer.alloc(5), 0, 5, 0);
          if (bytesRead === 5 && buffer.toString('ascii') === '%PDF-') {
            return true;
          }
        } finally {
          await fd.close();
        }
        const stat = await fsp.stat(filePath).catch(() => null);
        const withinRepairLimit = !!(stat && stat.size <= MAX_BASE64_REPAIR_BYTES);
        if (withinRepairLimit) {
          const content = await fsp.readFile(filePath, 'utf8').catch(() => null);
          if (content && /^[A-Za-z0-9+/=\r\n]+$/.test(content)) {
            try {
              const decoded = Buffer.from(content.replace(/\s+/g, ''), 'base64');
              if (decoded.length > 0 && decoded.slice(0, 5).toString('ascii') === '%PDF-') {
                await writeFileAtomic(filePath, decoded);
                return true;
              }
            } catch (_) {}
          }
        }
        if (canRegen && htmlForRegen) {
          try {
            const regenBuf = await generatePDFBufferFromHTML(htmlForRegen);
            await writeFileAtomic(filePath, regenBuf);
            return true;
          } catch (_) {}
        }
        return false;
      } catch (_) {
        return false;
      }
    };

    const canRegen = deliveredSigned === false;
    if (canRegen && !htmlCache) {
      htmlCache = generateReportHTML(report);
    }
    if (!(await ensureValidPdf(finalPath, canRegen, canRegen ? htmlCache : null))) {
      return res.status(500).json({ success: false, error: { code: 'INVALID_PDF', message: 'PDF dosyası geçersiz veya bozuk görünüyor' } });
    }

    const suffix = deliveredSigned ? '_signed' : '';
    const rawFilename = `${report.equipment_name}_${report.work_order_number}_${report.inspection_date}${suffix}.pdf`;

    const buildContentDisposition = (name) => {
      const safeAscii = String(name)
        .replace(/[\r\n]/g, ' ')
        .replace(/["]+/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .slice(0, 150) || 'rapor.pdf';
      const encoded = encodeURIComponent(String(name));
      return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', buildContentDisposition(rawFilename));
    return res.sendFile(path.resolve(finalPath));
  } catch (error) {
    console.error('Download public report error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Rapor indirilirken bir hata oluştu' } });
  }
};

const getSigningData = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const result = await pool.query(
      `SELECT r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
              i.status as inspection_status,
              e.name as equipment_name, e.type as equipment_type, e.template,
              t.name as technician_name, t.surname as technician_surname,
              wo.work_order_number, wo.company_id,
              cc.name as customer_name,
              comp.name as company_name, comp.logo_url
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN equipment e ON i.equipment_id = e.id
       JOIN technicians t ON i.technician_id = t.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       JOIN customer_companies cc ON wo.customer_company_id = cc.id
       JOIN companies comp ON wo.company_id = comp.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rapor bulunamadı' } });
    }

    const report = result.rows[0];
    await attachReportQrCode(report);
    if (report.company_id !== companyId) {
      return res.status(403).json({ success: false, error: { code: 'PERMISSION_DENIED', message: 'Bu rapora erişim yetkiniz yok' } });
    }
    if (report.inspection_status !== 'completed') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Sadece tamamlanmış muayenelerin raporları imzalanabilir' } });
    }

    const { path: pdfPath } = await resolvePdfPath(report, false);
    if (!pdfPath || !(await fileExists(pdfPath))) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'İmzalanacak PDF bulunamadı' } });
    }

    const b64 = await readFileBase64(pdfPath);
    return res.json({ success: true, data: { pdfBase64: b64 } });
  } catch (error) {
    console.error('Get signing data error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'İmzalama verileri alınırken bir hata oluştu' } });
  }
};

// Helper function to generate HTML from inspection data (typed sections + legacy)
const { buildHTML } = require('../utils/reportRenderer');
const generateReportHTML = (report) => buildHTML(report);

// Helper function to convert HTML to PDF
const generatePDFFromHTML = (html) => generatePDFFromHTMLPuppeteer(html);

// Explicitly prepare (generate) unsigned PDF and store it
const prepareReportPdf = async (req, res) => {
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
        error: { code: 'NOT_FOUND', message: 'Rapor bulunamadı' }
      });
    }

    const report = result.rows[0];
    await attachReportQrCode(report);
    const html = generateReportHTML(report);
    const buf = await generatePDFBufferFromHTML(html);
    const out = unsignedPdfPath(id);
    await writeFileAtomic(out, buf);
    await pool.query('UPDATE reports SET unsigned_pdf_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [out, id]);

    return res.json({ success: true, message: 'Rapor PDF oluşturuldu', data: { reportId: id } });
  } catch (error) {
    console.error('Prepare report PDF error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Rapor oluşturulurken bir hata oluştu' } });
  }
};

// Enqueue async PDF generation job
const enqueueReportPrepare = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Check ownership
    const check = await pool.query(
      `SELECT r.id
       FROM reports r
       JOIN inspections i ON r.inspection_id = i.id
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE r.id = $1 AND wo.company_id = $2`,
      [id, companyId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rapor bulunamadı' } });
    }

    // Ensure single active job per report
    const existing = await pool.query(
      `SELECT id, status FROM report_jobs WHERE report_id = $1 AND status IN ('pending','processing') LIMIT 1`,
      [id]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ success: true, data: { jobId: existing.rows[0].id, status: existing.rows[0].status } });
    }

    const job = await pool.query(
      `INSERT INTO report_jobs (report_id, status) VALUES ($1, 'pending') RETURNING id, status`,
      [id]
    );
    return res.status(202).json({ success: true, data: { jobId: job.rows[0].id, status: job.rows[0].status } });
  } catch (error) {
    console.error('Enqueue report job error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'İş kuyruğa alınırken bir hata oluştu' } });
  }
};

// Get async job status
const getReportJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await pool.query('SELECT id, report_id, status, attempts, last_error, created_at, started_at, finished_at FROM report_jobs WHERE id = $1', [jobId]);
    if (job.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'İş bulunamadı' } });
    }
    return res.json({ success: true, data: job.rows[0] });
  } catch (error) {
    console.error('Get report job status error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'İş durumu alınamadı' } });
  }
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
  downloadPublicReport,
  signReport,
  sendReport,
  getPublicReport,
  getSigningData,
  updateReportStyle,
  prepareReportPdf,
  enqueueReportPrepare,
  getReportJobStatus,
  signReportValidation,
  // Export helpers for internal reuse
  generateReportHTML,
  generatePDFFromHTML,
  attachReportQrCode
};
