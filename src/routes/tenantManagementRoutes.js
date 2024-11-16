const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validateRequest');
const tenantManagementController = require('../controllers/tenantManagementController');
const tenantController = require('../controllers/tenantController');

// Apply rate limiter conditionally (production only)
const conditionalRateLimiter = process.env.NODE_ENV === 'production' ? apiLimiter : (req, res, next) => next();

/**
 * @swagger
 * components:
 *   schemas:
 *     Status:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         reason:
 *           type: string
 *     Settings:
 *       type: object
 *       properties:
 *         timezone:
 *           type: string
 *         dateFormat:
 *           type: string
 *         language:
 *           type: string
 *         notificationPreferences:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *             slack:
 *               type: boolean
 *     Metadata:
 *       type: object
 *       properties:
 *         industry:
 *           type: string
 *         subIndustry:
 *           type: string
 *         companySize:
 *           type: string
 *         region:
 *           type: string
 *         country:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * tags:
 *   name: Tenant Management
 *   description: Tenant management operations
 */

// Route: Update Tenant Status
router.put(
  '/tenants/:id/status',
  protect,
  conditionalRateLimiter,
  validate('updateTenantStatus'),
  tenantManagementController.updateTenantStatus
);

// Route: Get Tenant Status
router.get(
  '/tenants/:id/status',
  protect,
  tenantManagementController.getTenantStatus
);

// Route: Get Tenant Status History
router.get(
  '/tenants/:id/status/history',
  protect,
  tenantManagementController.getTenantStatusHistory
);

// Route: Bulk Update Tenant Statuses
router.post(
  '/tenants/bulk/status',
  protect,
  conditionalRateLimiter,
  validate('bulkUpdateStatus'),
  tenantManagementController.bulkUpdateStatus
);

// Route: Update Tenant Settings
router.put(
  '/tenants/:id/settings',
  protect,
  validate('updateTenantSettings'),  // Changed from 'updateSettings'
  tenantManagementController.updateTenantSettings
);

// Route: Get Tenant Settings
router.get(
  '/tenants/:id/settings',
  protect,
  tenantManagementController.getTenantSettings
);

// Route: Update Tenant Metadata
router.put(
  '/tenants/:id/metadata',
  protect,
  validate('updateTenantMetadata'),  // Changed from 'updateMetadata'
  tenantManagementController.updateTenantMetadata
);

// Route: Get Tenant Metadata
router.get(
  '/tenants/:id/metadata',
  protect,
  tenantManagementController.getTenantMetadata
);

module.exports = router;