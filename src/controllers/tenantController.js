const mongoose = require('mongoose');
const { Tenant } = require('../models/tenantModel');

const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Name is required' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return { isValid: false, message: 'Name is required' };
  }
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  if (trimmedName.length > 100) {
    return { isValid: false, message: 'Name cannot exceed 100 characters' };
  }
  return { isValid: true, trimmedName };
};

exports.createTenant = async (req, res, next) => {
  try {
    const nameValidation = validateName(req.body.name);
    if (!nameValidation.isValid) {
      return res.status(400).json({ message: nameValidation.message });
    }

    const tenant = new Tenant({
      ...req.body,
      name: nameValidation.trimmedName
    });

    const validationError = tenant.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: Object.values(validationError.errors)
          .map(err => err.message)
          .join(', ')
      });
    }

    const saved = await tenant.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A tenant with this email already exists' });
    }
    next(error);
  }
};

exports.getAllTenants = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.industry) query.industry = req.query.industry;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { industry: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [results, total] = await Promise.all([
      Tenant.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Tenant.countDocuments(query)
    ]);

    res.status(200).json({
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTenantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tenant ID format' });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant);
  } catch (error) {
    next(error);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tenant ID format' });
    }

    if (req.body.name) {
      const nameValidation = validateName(req.body.name);
      if (!nameValidation.isValid) {
        return res.status(400).json({ message: nameValidation.message });
      }
      req.body.name = nameValidation.trimmedName;
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(tenant);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A tenant with this email already exists' });
    }
    next(error);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tenant ID format' });
    }

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.bulkDeleteTenants = async (req, res, next) => {
  try {
    const { tenantIds } = req.body;
    
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ message: 'No tenant IDs provided' });
    }

    const invalidIds = tenantIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'Some tenant IDs are invalid', invalidIds });
    }

    const result = await Tenant.deleteMany({ _id: { $in: tenantIds } });
    res.status(200).json({ 
      message: 'Tenants deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    next(error);
  }
};