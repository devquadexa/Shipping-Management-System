/**
 * ContactPerson Domain Entity
 * Represents a contact person for a customer
 */
class ContactPerson {
  constructor({
    contactPersonId,
    customerId,
    name,
    phone
  }) {
    this.contactPersonId = contactPersonId;
    this.customerId = customerId;
    this.name = name;
    this.phone = phone;
  }

  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Contact person name is required');
    }
    
    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('Contact person phone is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ContactPerson;
