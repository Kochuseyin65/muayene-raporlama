const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/equipment - Get all equipment
router.get('/', 
  authMiddleware, 
  requirePermission('viewEquipment'), 
  equipmentController.getEquipment
);

// GET /api/equipment/types - Get equipment types
router.get('/types', 
  authMiddleware, 
  requirePermission('viewEquipment'), 
  equipmentController.getEquipmentTypes
);

// GET /api/equipment/:id - Get equipment by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewEquipment'), 
  equipmentController.getEquipmentById
);

// POST /api/equipment - Create new equipment
router.post('/', 
  authMiddleware, 
  requirePermission('createEquipment'),
  equipmentController.createEquipmentValidation,
  equipmentController.createEquipment
);

// PUT /api/equipment/:id - Update equipment
router.put('/:id', 
  authMiddleware, 
  requirePermission('editEquipment'),
  equipmentController.updateEquipmentValidation,
  equipmentController.updateEquipment
);

// PUT /api/equipment/:id/template - Update equipment template only
router.put('/:id/template', 
  authMiddleware, 
  requirePermission('editEquipment'),
  equipmentController.updateTemplateValidation,
  equipmentController.updateEquipmentTemplate
);

// DELETE /api/equipment/:id - Delete equipment
router.delete('/:id', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'editEquipment']), 
  equipmentController.deleteEquipment
);

module.exports = router;