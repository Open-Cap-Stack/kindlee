// src/tests/helpers/testData.js
const validTenantData = {
    name: 'Test Tenant',
    industry: 'Finance',
    contact_email: 'admin@testtenant.com',
    subscription_tier: 'Professional',
    compliance_level: 'Enhanced',
  };
  
  const generateTenants = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      ...validTenantData,
      name: `Tenant ${i + 1}`,
      contact_email: `tenant${i + 1}@test.com`
    }));
  };
  
  module.exports = {
    validTenantData,
    generateTenants
  };