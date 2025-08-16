const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/technicians - Get all technicians in company
router.get('/', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'viewTechnicians']), 
  technicianController.getTechnicians
);

// GET /api/technicians/:id - Get technician by ID
router.get('/:id', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'viewTechnicians']), 
  technicianController.getTechnician
);

// POST /api/technicians - Create new technician
router.post('/', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  technicianController.createTechnicianValidation,
  technicianController.createTechnician
);

// PUT /api/technicians/:id - Update technician
router.put('/:id', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  technicianController.updateTechnicianValidation,
  technicianController.updateTechnician
);

// PUT /api/technicians/:id/permissions - Update technician permissions
router.put('/:id/permissions', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  technicianController.updatePermissionsValidation,
  technicianController.updateTechnicianPermissions
);

// PUT /api/technicians/:id/password - Update technician password
router.put('/:id/password', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  technicianController.updatePasswordValidation,
  technicianController.updateTechnicianPassword
);

// DELETE /api/technicians/:id - Delete technician
router.delete('/:id', 
  authMiddleware, 
  requirePermission('companyAdmin'), 
  technicianController.deleteTechnician
);

module.exports = router;