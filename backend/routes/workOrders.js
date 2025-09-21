const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/work-orders - Get all work orders
router.get('/', 
  authMiddleware, 
  requireAnyPermission(['viewWorkOrders', 'viewMyWorkOrders']), 
  workOrderController.getWorkOrders
);

// GET /api/work-orders/:id - Get work order by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewWorkOrders'), 
  workOrderController.getWorkOrder
);

// POST /api/work-orders - Create new work order
router.post('/', 
  authMiddleware, 
  requirePermission('createWorkOrder'),
  workOrderController.createWorkOrderValidation,
  workOrderController.createWorkOrder
);

// PUT /api/work-orders/:id - Update work order
router.put('/:id', 
  authMiddleware, 
  requirePermission('editWorkOrder'),
  workOrderController.updateWorkOrderValidation,
  workOrderController.updateWorkOrder
);

// PUT /api/work-orders/:id/assign - Assign technicians to work order
router.put('/:id/assign', 
  authMiddleware, 
  requirePermission('assignWorkOrder'),
  workOrderController.assignTechniciansValidation,
  workOrderController.assignTechnicians
);

// PUT /api/work-orders/:id/status - Update work order status
router.put('/:id/status', 
  authMiddleware, 
  requirePermission('updateWorkOrderStatus'),
  workOrderController.updateStatusValidation,
  workOrderController.updateWorkOrderStatus
);

// DELETE /api/work-orders/:id - Delete work order
router.delete('/:id', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'editWorkOrder']), 
  workOrderController.deleteWorkOrder
);

module.exports = router;
