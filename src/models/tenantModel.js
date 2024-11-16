const mongoose = require('mongoose');

// Common validation patterns
const EMAIL_PATTERN = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const PHONE_PATTERN = /^\+?[\d\s-]{10,}$/;

// Enums
const ENUMS = {
  INDUSTRIES: ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'],
  STATUS: ['active', 'inactive', 'suspended'],
  SUBSCRIPTION_TIERS: ['Basic', 'Professional', 'Enterprise'],
  COMPLIANCE_LEVELS: ['Standard', 'Enhanced', 'Premium'],
  COMPANY_SIZES: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
};

// Validators
const validators = {
  timezone: (v) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: v });
      return true;
    } catch (e) {
      return false;
    }
  },
  dateFormat: (v) => /^[MDYmdy\/\-\.\s]+$/.test(v),
  language: (v) => {
    try {
      new Intl.Locale(v);
      return true;
    } catch (e) {
      return false;
    }
  },
  country: (v) => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(v) !== undefined;
    } catch (e) {
      return false;
    }
  },
  phone: (v) => !v || PHONE_PATTERN.test(v),
  email: (v) => EMAIL_PATTERN.test(v),
  name: (v) => {
    const trimmed = v.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  }
};

// Sub-schemas
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ENUMS.STATUS,
      message: 'Invalid status value'
    }
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  changedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Change date is required']
  },
  changedBy: {
    type: String,
    trim: true,
    default: 'system'
  }
});

const settingsSchema = new mongoose.Schema({
  timezone: {
    type: String,
    default: 'UTC',
    validate: {
      validator: validators.timezone,
      message: 'Invalid timezone'
    }
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY',
    validate: {
      validator: validators.dateFormat,
      message: 'Invalid date format'
    }
  },
  language: {
    type: String,
    default: 'en-US',
    validate: {
      validator: validators.language,
      message: 'Invalid language code'
    }
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false }
  }
});

const primaryContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Contact name must be at least 2 characters'],
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: validators.phone,
      message: 'Invalid phone number format'
    }
  }
});

const metadataSchema = new mongoose.Schema({
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: {
      values: ENUMS.INDUSTRIES,
      message: 'Invalid industry value'
    }
  },
  subIndustry: {
    type: String,
    trim: true,
    maxlength: [100, 'Sub-industry cannot exceed 100 characters']
  },
  companySize: {
    type: String,
    enum: {
      values: ENUMS.COMPANY_SIZES,
      message: 'Invalid company size'
    }
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    validate: {
      validator: validators.country,
      message: 'Invalid country code'
    }
  },
  primaryContact: primaryContactSchema,
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
});

// Main tenant schema
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    validate: {
      validator: validators.name,
      message: props => {
        if (!props.value.trim()) return 'Name cannot be empty or only whitespace';
        if (props.value.trim().length < 2) return 'Name must be at least 2 characters';
        return 'Name must be at most 100 characters';
      }
    },
    index: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: {
      values: ENUMS.INDUSTRIES,
      message: 'Invalid industry value'
    }
  },
  contact_email: {
    type: String,
    required: [true, 'Contact email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validators.email,
      message: 'Invalid email format'
    },
    index: true
  },
  subscription_tier: {
    type: String,
    required: [true, 'Subscription tier is required'],
    enum: {
      values: ENUMS.SUBSCRIPTION_TIERS,
      message: 'Invalid subscription tier'
    }
  },
  compliance_level: {
    type: String,
    required: [true, 'Compliance level is required'],
    enum: {
      values: ENUMS.COMPLIANCE_LEVELS,
      message: 'Invalid compliance level'
    }
  },
  status: {
    type: String,
    enum: {
      values: ENUMS.STATUS,
      message: 'Invalid status value'
    },
    default: 'active',
    index: true
  },
  statusReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Status reason cannot exceed 500 characters']
  },
  statusChangedAt: {
    type: Date,
    default: Date.now
  },
  statusHistory: [statusHistorySchema],
  settings: {
    type: settingsSchema,
    default: () => ({})
  },
  metadata: {
    type: metadataSchema,
    required: [true, 'Metadata is required']
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
tenantSchema.index({ 'metadata.industry': 1 });
tenantSchema.index({ 'metadata.region': 1 });
tenantSchema.index({ 'metadata.country': 1 });
tenantSchema.index({ created_at: -1 });
tenantSchema.index({ status: 1, created_at: -1 });

// Middleware
tenantSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    this.statusChangedAt = new Date();
    this.statusHistory.push({
      status: this.status,
      reason: this.statusReason,
      changedAt: this.statusChangedAt,
      changedBy: this.changedBy || 'system'
    });
  }

  if (this.isModified('contact_email')) {
    const existingTenant = await this.constructor.findOne({
      contact_email: this.contact_email.toLowerCase(),
      _id: { $ne: this._id }
    });
    if (existingTenant) {
      next(new Error('A tenant with this email already exists'));
    }
  }

  next();
});

// Instance methods
Object.assign(tenantSchema.methods, {
  isActive() {
    return this.status === 'active';
  },
  
  canUpgrade() {
    return this.status === 'active' && this.subscription_tier !== 'Enterprise';
  },
  
  getStatusDuration() {
    return new Date() - this.statusChangedAt;
  }
});

// Static methods
Object.assign(tenantSchema.statics, {
  findActive() {
    return this.find({ status: 'active' });
  },
  
  findByIndustry(industry) {
    return this.find({ 
      $or: [
        { industry },
        { 'metadata.industry': industry }
      ]
    });
  },
  
  findByTier(tier) {
    return this.find({ subscription_tier: tier });
  }
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = { Tenant, ENUMS };