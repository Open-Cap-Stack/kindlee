// src/routes/index.js
const express = require('express');
const router = express.Router();
const tenantRoutes = require('./tenantRoutes');
const tenantManagementRoutes = require('./tenantManagementRoutes');

// API Documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Tenant Management API',
    version: '1.0.0',
    endpoints: {
      tenant: {
        base: '/api/tenants',
        docs: '/api/docs/tenants'
      },
      management: {
        status: '/api/tenants/:id/status',
        settings: '/api/tenants/:id/settings',
        metadata: '/api/tenants/:id/metadata',
        bulk: '/api/tenants/bulk/status'
      }
    }
  });
});

// Mount routes
router.use('/api', tenantRoutes);
router.use('/api', tenantManagementRoutes);

module.exports = router;