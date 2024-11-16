const { body, param, validationResult } = require('express-validator');

const schemas = {
  // Tenant Creation and Update
  createTenant: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('industry')
      .trim()
      .notEmpty()
      .withMessage('Industry is required')
      .isIn(['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'])
      .withMessage('Invalid industry value'),
    body('contact_email')
      .trim()
      .notEmpty()
      .withMessage('Contact email is required')
      .isEmail()
      .withMessage('Invalid email format'),
    body('subscription_tier')
      .trim()
      .notEmpty()
      .withMessage('Subscription tier is required')
      .isIn(['Basic', 'Professional', 'Enterprise'])
      .withMessage('Invalid subscription tier'),
    body('compliance_level')
      .trim()
      .notEmpty()
      .withMessage('Compliance level is required')
      .isIn(['Standard', 'Enhanced', 'Premium'])
      .withMessage('Invalid compliance level')
  ],

  updateTenant: [
    param('id').isMongoId().withMessage('Invalid tenant ID format'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty'),
    body('industry')
      .optional()
      .trim()
      .isIn(['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'])
      .withMessage('Invalid industry value'),
    body('contact_email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),
    body('subscription_tier')
      .optional()
      .trim()
      .isIn(['Basic', 'Professional', 'Enterprise'])
      .withMessage('Invalid subscription tier'),
    body('compliance_level')
      .optional()
      .trim()
      .isIn(['Standard', 'Enhanced', 'Premium'])
      .withMessage('Invalid compliance level')
  ],

  // ID Validation
  getTenantById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid tenant ID format')
  ],

  deleteTenant: [
    param('id')
      .isMongoId()
      .withMessage('Invalid tenant ID format')
  ],

  // Bulk Operations
  bulkDeleteTenants: [
    body('tenantIds')
      .isArray()
      .withMessage('tenantIds must be an array')
      .notEmpty()
      .withMessage('tenantIds array cannot be empty')
      .custom((value) => {
        if (!Array.isArray(value)) return false;
        return value.every((id) => /^[0-9a-fA-F]{24}$/.test(id));
      })
      .withMessage('All tenant IDs must be valid MongoDB ObjectIDs')
  ],

  bulkUpdateStatus: [
    body('tenantIds')
      .isArray()
      .withMessage('tenantIds must be an array')
      .notEmpty()
      .withMessage('tenantIds array cannot be empty')
      .custom((value) => {
        if (!Array.isArray(value)) return false;
        return value.every((id) => /^[0-9a-fA-F]{24}$/.test(id));
      })
      .withMessage('All tenant IDs must be valid MongoDB ObjectIDs'),
    body('status')
      .trim()
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid status value'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason for status change is required')
  ],

  // Tenant Status Management
  updateTenantStatus: [
    param('id')
      .isMongoId()
      .withMessage('Invalid tenant ID format'),
    body('status')
      .trim()
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Invalid status value'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason for status change is required')
  ],

  // Tenant Settings
  updateTenantSettings: [
    param('id')
      .isMongoId()
      .withMessage('Invalid tenant ID format'),
    body('timezone')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Timezone cannot be empty'),
    body('dateFormat')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Date format cannot be empty'),
    body('language')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Language cannot be empty'),
    body('notificationPreferences')
      .optional()
      .isObject()
      .withMessage('Invalid notification preferences format')
  ],

  // Tenant Metadata
  updateTenantMetadata: [
    param('id')
      .isMongoId()
      .withMessage('Invalid tenant ID format'),
    body('industry')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Industry cannot be empty'),
    body('subIndustry')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Sub-industry cannot be empty'),
    body('companySize')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Company size cannot be empty'),
    body('region')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Region cannot be empty'),
    body('country')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Country cannot be empty'),
    body('primaryContact')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Primary contact cannot be empty'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ]
};

const validate = (validationName) => {
  if (!schemas[validationName]) {
    throw new Error(`Validation schema "${validationName}" does not exist`);
  }
  
  return [
    ...schemas[validationName],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return res.status(400).json({ 
          message: errorMessages.join(', ')
        });
      }
      next();
    }
  ];
};

module.exports = {
  validate
};