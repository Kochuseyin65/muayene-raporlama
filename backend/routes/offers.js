const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/offers - Get all offers
router.get('/', 
  authMiddleware, 
  requirePermission('viewOffers'), 
  offerController.getOffers
);

// GET /api/offers/track/:token - Track offer (public, no auth required)
router.get('/track/:token', 
  offerController.trackOffer
);

// Public offer acceptance/decline by customer
router.post('/track/:token/accept', 
  offerController.acceptOfferByCustomer
);
router.post('/track/:token/decline', 
  offerController.declineOfferByCustomer
);

// GET /api/offers/:id - Get offer by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewOffers'), 
  offerController.getOffer
);

// POST /api/offers - Create new offer
router.post('/', 
  authMiddleware, 
  requirePermission('createOffer'),
  offerController.createOfferValidation,
  offerController.createOffer
);

// PUT /api/offers/:id - Update offer
router.put('/:id', 
  authMiddleware, 
  requirePermission('editOffer'),
  offerController.updateOfferValidation,
  offerController.updateOffer
);

// POST /api/offers/:id/approve - Approve offer
router.post('/:id/approve', 
  authMiddleware, 
  requirePermission('approveOffer'), 
  offerController.approveOffer
);

// POST /api/offers/:id/send - Send offer to customer
router.post('/:id/send', 
  authMiddleware, 
  requirePermission('sendOffer'), 
  offerController.sendOffer
);

// POST /api/offers/:id/convert-to-work-order - Convert offer to work order
router.post('/:id/convert-to-work-order', 
  authMiddleware, 
  requirePermission('createWorkOrder'),
  offerController.convertToWorkOrderValidation,
  offerController.convertToWorkOrder
);

// DELETE /api/offers/:id - Delete offer
router.delete('/:id', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'editOffer']), 
  offerController.deleteOffer
);

module.exports = router;
