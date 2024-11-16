const mongoose = require('mongoose');
const Tenant = require('../models/tenantModel');
const { checkConnection, validateTenantId, handleError } = require('../utils/dbHelpers');

exports.updateTenantStatus = async (req, res) => {
  try {
    await checkConnection(mongoose.connection); // Explicitly pass the connection
    const { id } = req.params;
    validateTenantId(id);

    const { status, reason } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.status = status;
    tenant.statusReason = reason;
    tenant.statusChangedAt = new Date();
    tenant.statusHistory.push({
      status,
      reason,
      changedAt: new Date(),
      changedBy: req.user?.id || 'system',
    });

    await tenant.save();
    res.status(200).json({
      status: tenant.status,
      reason: tenant.statusReason,
      changedAt: tenant.statusChangedAt,
    });
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.getTenantStatus = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const tenant = await Tenant.findById(id).select('status statusReason statusChangedAt');
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json({
      status: tenant.status,
      reason: tenant.statusReason,
      changedAt: tenant.statusChangedAt,
    });
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.getTenantStatusHistory = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const tenant = await Tenant.findById(id).select('statusHistory');
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant.statusHistory);
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const allowedSettings = [
      'timezone',
      'dateFormat',
      'language',
      'notificationPreferences',
    ];

    const invalidKeys = Object.keys(req.body).filter((key) => !allowedSettings.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        message: `Invalid settings: ${invalidKeys.join(', ')}`,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.settings = { ...tenant.settings, ...req.body };
    await tenant.save();

    res.status(200).json(tenant.settings);
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.getTenantSettings = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const tenant = await Tenant.findById(id).select('settings');
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant.settings);
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.updateTenantMetadata = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const allowedMetadataFields = [
      'industry',
      'subIndustry',
      'companySize',
      'region',
      'country',
      'primaryContact',
      'tags',
    ];

    const invalidKeys = Object.keys(req.body).filter((key) => !allowedMetadataFields.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        message: `Invalid metadata fields: ${invalidKeys.join(', ')}`,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.metadata = { ...tenant.metadata, ...req.body };
    await tenant.save();

    res.status(200).json(tenant.metadata);
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.getTenantMetadata = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { id } = req.params;
    validateTenantId(id);

    const tenant = await Tenant.findById(id).select('metadata');
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant.metadata);
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  try {
    await checkConnection(mongoose.connection);
    const { tenantIds, status, reason } = req.body;

    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ message: 'No tenant IDs provided' });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const invalidIds = tenantIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: `Invalid tenant ID format: ${invalidIds.join(', ')}` });
    }

    const updatePromises = tenantIds.map(async (id) => {
      const tenant = await Tenant.findById(id);
      if (tenant) {
        tenant.status = status;
        tenant.statusReason = reason;
        tenant.statusChangedAt = new Date();
        tenant.statusHistory.push({
          status,
          reason,
          changedAt: new Date(),
          changedBy: req.user?.id || 'system',
        });
        return tenant.save();
      }
      return null;
    });

    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter((result) => result !== null).length;

    res.status(200).json({
      message: `Successfully updated ${updatedCount} tenants`,
      updatedCount,
    });
  } catch (error) {
    const { status, message } = handleError(error);
    res.status(status).json({ message });
  }
};