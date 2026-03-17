/**
 * User Domain Entity
 * Represents a system user
 */
class User {
  constructor({
    userId,
    username,
    password, // Should be hashed
    fullName,
    role,
    email,
    createdDate = new Date(),
    isActive = true,
    metadata = {}
  }) {
    this.userId = userId;
    this.username = username;
    this.password = password;
    this.fullName = fullName;
    this.role = role;
    this.email = email;
    this.createdDate = createdDate;
    this.isActive = isActive;
    this.metadata = metadata;
  }

  validate() {
    const errors = [];
    
    if (!this.username || this.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    if (!this.fullName) {
      errors.push('Full name is required');
    }
    
    if (!this.role || !this.isValidRole(this.role)) {
      errors.push('Valid role is required');
    }
    
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidRole(role) {
    const validRoles = ['Super Admin', 'Admin', 'Manager', 'Office Executive', 'Waff Clerk'];
    return validRoles.includes(role);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  hasPermission(permission) {
    const permissions = {
      'Super Admin': ['*'], // All permissions
      'Admin': ['manage_customers', 'manage_jobs', 'manage_billing', 'manage_petty_cash'],
      'Manager': ['manage_customers', 'manage_jobs', 'manage_billing', 'manage_petty_cash'],
      'Office Executive': ['manage_customers', 'manage_jobs', 'manage_office_pay_items'], // No billing access
      'Waff Clerk': ['view_assigned_jobs', 'manage_own_petty_cash']
    };
    
    const userPermissions = permissions[this.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  canManageUsers() {
    return this.role === 'Super Admin';
  }

  canManageCustomers() {
    return this.role === 'Super Admin' || this.role === 'Admin' || this.role === 'Manager' || this.role === 'Office Executive';
  }

  // Remove sensitive data for API responses
  toSafeObject() {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}

module.exports = User;
