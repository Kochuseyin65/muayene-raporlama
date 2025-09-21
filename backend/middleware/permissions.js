const PERMISSIONS = {
  // Company Management
  "companyAdmin": "Firma yönetimi",
  "superAdmin": "Sistem yönetimi",
  
  // User Management
  "viewTechnicians": "Teknisyenleri görüntüle",
  "createTechnician": "Teknisyen oluştur",
  "editTechnician": "Teknisyen düzenle",
  "deleteTechnician": "Teknisyen sil",
  
  // Customer Management
  "viewCustomers": "Müşterileri görüntüle",
  "createCustomer": "Müşteri oluştur",
  "editCustomer": "Müşteri düzenle",
  
  // Equipment Management
  "viewEquipment": "Ekipmanları görüntüle",
  "createEquipment": "Ekipman oluştur",
  "editEquipment": "Ekipman düzenle",
  
  // Offer Management
  "viewOffers": "Teklifleri görüntüle",
  "createOffer": "Teklif oluştur",
  "editOffer": "Teklif düzenle",
  "approveOffer": "Teklif onayla",
  "sendOffer": "Teklif gönder",
  
  // Work Order Management
  "viewWorkOrders": "İş emirlerini görüntüle",
  "viewMyWorkOrders": "Benim iş emirlerimi görüntüle",
  "createWorkOrder": "İş emri oluştur",
  "editWorkOrder": "İş emri düzenle",
  "assignWorkOrder": "İş emri ata",
  "updateWorkOrderStatus": "İş emri durumu güncelle",

  // Inspection Management
  "viewInspections": "Muayeneleri görüntüle",
  "viewMyInspections": "Benim muayenelerimi görüntüle",
  "editInspection": "Muayene düzenle",
  "saveInspection": "Muayene kaydet",
  "completeInspection": "Muayene tamamla",
  "uploadPhotos": "Fotoğraf yükle",
  
  // Report Management
  "viewReports": "Raporları görüntüle",
  "downloadReports": "Rapor indir",
  "signReports": "Rapor imzala",
  "sendReports": "Rapor gönder",
  
  // Dashboard & Calendar
  "viewDashboard": "Dashboard görüntüle",
  "viewCalendar": "Takvim görüntüle"
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kimlik doğrulama gerekli'
        }
      });
    }
    
    const userPermissions = req.user.permissions || [];
    
    // Süper admin her şeye erişebilir
    if (userPermissions.includes('superAdmin')) {
      return next();
    }
    
    // Gerekli permission kontrolü
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu işlem için yetkiniz bulunmuyor',
          details: `${permission} permission required`
        }
      });
    }
    
    next();
  };
};

const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kimlik doğrulama gerekli'
        }
      });
    }
    
    const userPermissions = req.user.permissions || [];
    
    // Süper admin her şeye erişebilir
    if (userPermissions.includes('superAdmin')) {
      return next();
    }
    
    // Gerekli permission'lardan herhangi birini kontrol et
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bu işlem için yetkiniz bulunmuyor',
          details: `One of these permissions required: ${permissions.join(', ')}`
        }
      });
    }
    
    next();
  };
};

const checkPermission = (userId, permission) => {
  return async (req, res, next) => {
    try {
      const pool = require('../config/database');
      const result = await pool.query(
        'SELECT permissions FROM technicians WHERE id = $1 AND is_active = true',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const userPermissions = result.rows[0].permissions || [];
      
      // Süper admin her şeye erişebilir
      if (userPermissions.includes('superAdmin')) {
        return true;
      }
      
      return userPermissions.includes(permission);
      
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };
};

module.exports = {
  PERMISSIONS,
  requirePermission,
  requireAnyPermission,
  checkPermission
};
