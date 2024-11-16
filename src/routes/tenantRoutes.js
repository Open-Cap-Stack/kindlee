const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');

// Create new tenant
router.post(
  '/tenants',
  protect,
  validate('createTenant'),
  tenantController.createTenant
);

// Get all tenants
router.get(
  '/tenants',
  protect,
  tenantController.getAllTenants
);

// Get single tenant
router.get(
  '/tenants/:id',
  protect,
  validate('getTenantById'),
  tenantController.getTenantById
);

// Update tenant
router.put(
  '/tenants/:id',
  protect,
  validate('updateTenant'),
  tenantController.updateTenant
);

// Delete single tenant
router.delete(
  '/tenants/:id',
  protect,
  validate('deleteTenant'),
  tenantController.deleteTenant
);

// Bulk delete tenants
router.post(
  '/tenants/bulk/delete',
  protect,
  validate('bulkDeleteTenants'),
  tenantController.bulkDeleteTenants
);

module.exports = router;