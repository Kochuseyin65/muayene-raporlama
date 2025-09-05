const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'Dosya seçilmedi'
        }
      });
    }
    
    const companyId = req.user.company_id;
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Update company logo URL in database
    const result = await pool.query(
      'UPDATE companies SET logo_url = $1 WHERE id = $2 RETURNING logo_url',
      [logoUrl, companyId]
    );
    
    if (result.rows.length === 0) {
      // Clean up uploaded file if company update failed
      fs.unlinkSync(req.file.path);
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
      data: {
        logoUrl: logoUrl,
        filename: req.file.filename,
        size: req.file.size
      },
      message: 'Logo başarıyla yüklendi'
    });
    
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    console.error('Upload company logo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Logo yüklenirken bir hata oluştu'
      }
    });
  }
};

const uploadInspectionPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'Fotoğraf seçilmedi'
        }
      });
    }
    
    const inspectionId = req.params.inspectionId;
    const companyId = req.user.company_id;
    
    // Verify inspection exists and belongs to the company
    const inspectionCheck = await pool.query(
      `SELECT i.id, i.photo_urls, i.inspection_data, wo.company_id
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE i.id = $1`,
      [inspectionId]
    );
    
    if (inspectionCheck.rows.length === 0) {
      // Clean up uploaded files
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error cleaning up file:', error);
        }
      });
      
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
      // Clean up uploaded files
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error cleaning up file:', error);
        }
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu muayeneye erişim yetkiniz yok'
        }
      });
    }
    
    // Process uploaded files
    const newPhotoUrls = req.files.map(file => `/uploads/inspections/${inspectionId}/${file.filename}`);
    
    // Get existing photo URLs
    const existingPhotos = inspection.photo_urls || [];
    const allPhotos = [...existingPhotos, ...newPhotoUrls];
    
    // Optionally map uploaded photos to a specific template field
    let updatedInspectionData = inspection.inspection_data || {};
    const bodyFieldName = req.body?.fieldName || req.body?.fieldNames;
    if (bodyFieldName) {
      const fieldNames = Array.isArray(bodyFieldName) ? bodyFieldName : newPhotoUrls.map(() => bodyFieldName);
      fieldNames.forEach((fname, idx) => {
        if (typeof fname === 'string' && fname.trim()) {
          const url = newPhotoUrls[idx] || newPhotoUrls[newPhotoUrls.length - 1];
          if (!Array.isArray(updatedInspectionData[fname])) {
            updatedInspectionData[fname] = [];
          }
          updatedInspectionData[fname].push(url);
        }
      });
    }

    // Update inspection with new photo URLs and optional mapping
    const result = await pool.query(
      'UPDATE inspections SET photo_urls = $1, inspection_data = $2 WHERE id = $3 RETURNING photo_urls',
      [JSON.stringify(allPhotos), JSON.stringify(updatedInspectionData), inspectionId]
    );
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/inspections/${inspectionId}/${file.filename}`
    }));
    
    res.json({
      success: true,
      data: {
        uploadedPhotos: uploadedFiles,
        totalPhotos: allPhotos.length
      },
      message: `${req.files.length} fotoğraf başarıyla yüklendi`
    });
    
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }
    
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

const deleteInspectionPhoto = async (req, res) => {
  try {
    const { inspectionId, photoFilename } = req.params;
    const companyId = req.user.company_id;
    
    // Verify inspection exists and belongs to the company
    const inspectionCheck = await pool.query(
      `SELECT i.id, i.photo_urls, wo.company_id
       FROM inspections i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE i.id = $1`,
      [inspectionId]
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
    
    const photoUrls = inspection.photo_urls || [];
    const photoUrlToDelete = `/uploads/inspections/${inspectionId}/${photoFilename}`;
    
    // Check if photo exists in the list
    if (!photoUrls.includes(photoUrlToDelete)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Fotoğraf bulunamadı'
        }
      });
    }
    
    // Remove photo URL from the list
    const updatedPhotoUrls = photoUrls.filter(url => url !== photoUrlToDelete);
    
    // Update inspection
    await pool.query(
      'UPDATE inspections SET photo_urls = $1 WHERE id = $2',
      [JSON.stringify(updatedPhotoUrls), inspectionId]
    );
    
    // Delete physical file
    const filePath = path.join(__dirname, '../uploads/inspections', inspectionId, photoFilename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Continue even if file deletion fails
    }
    
    res.json({
      success: true,
      message: 'Fotoğraf başarıyla silindi',
      data: {
        remainingPhotos: updatedPhotoUrls.length
      }
    });
    
  } catch (error) {
    console.error('Delete inspection photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Fotoğraf silinirken bir hata oluştu'
      }
    });
  }
};

const getUploadedFile = async (req, res) => {
  try {
    const { filename, inspectionId } = req.params;
    
    let filePath;
    if (inspectionId) {
      // Inspection photo: /uploads/inspections/:inspectionId/:filename
      filePath = path.join(__dirname, '../uploads/inspections', inspectionId, filename);
    } else {
      // Logo: /uploads/logos/:filename
      filePath = path.join(__dirname, '../uploads/logos', filename);
    }
    
    // Security check - ensure file is within uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Geçersiz dosya yolu'
        }
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dosya bulunamadı'
        }
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dosya bulunamadı'
        }
      });
    }
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Get uploaded file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Dosya okunurken bir hata oluştu'
      }
    });
  }
};

module.exports = {
  uploadCompanyLogo,
  uploadInspectionPhotos,
  deleteInspectionPhoto,
  getUploadedFile
};
