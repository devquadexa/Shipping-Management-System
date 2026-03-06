/**
 * ContactPerson Domain Entity
 * Represents a contact person for a customer
 */
class ContactPerson {
  constructor({
    contactPersonId,
    customerId,
    name,
    phone,
    email = null,
    designation = null
  }) {
    this.contactPersonId = contactPersonId;
    this.customerId = customerId;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.designation = designation;
  }

  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Contact person name is required');
    }
    
    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('Contact person phone is required');
    }
    
    // Email validation (optional but must be valid if provided)
    if (this.email && this.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        errors.push('Contact person email must be valid');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ContactPerson;
