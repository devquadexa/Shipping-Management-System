/**
 * Customer Domain Entity
 * Represents the core business concept of a Customer
 * Independent of database or framework
 */
class Customer {
  constructor({
    customerId,
    name,
    mainPhone,
    email,
    address,
    officeLocation,
    isSameLocation = false,
    website,
    registrationDate = new Date(),
    isActive = true,
    contactPersons = [], // Array of contact person objects
    categories = [] // Array of category IDs
  }) {
    this.customerId = customerId;
    this.name = name;
    this.mainPhone = mainPhone;
    this.email = email;
    this.address = address;
    this.officeLocation = officeLocation;
    this.isSameLocation = isSameLocation;
    this.website = website;
    this.registrationDate = registrationDate;
    this.isActive = isActive;
    this.contactPersons = contactPersons;
    this.categories = categories;
  }

  // Business logic methods
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Customer/Company name is required');
    }
    
    if (!this.mainPhone || this.mainPhone.trim().length === 0) {
      errors.push('Main phone number is required');
    }
    
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.address || this.address.trim().length === 0) {
      errors.push('Address is required');
    }

    // Validate contact persons (max 3)
    if (this.contactPersons && this.contactPersons.length > 3) {
      errors.push('Maximum 3 contact persons allowed');
    }

    // Validate each contact person
    if (this.contactPersons && this.contactPersons.length > 0) {
      this.contactPersons.forEach((cp, index) => {
        if (!cp.name || cp.name.trim().length === 0) {
          errors.push(`Contact person ${index + 1}: Name is required`);
        }
        if (!cp.phone || cp.phone.trim().length === 0) {
          errors.push(`Contact person ${index + 1}: Phone is required`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }

  updateContactInfo(mainPhone, email) {
    if (mainPhone) this.mainPhone = mainPhone;
    if (email && this.isValidEmail(email)) this.email = email;
  }
}

module.exports = Customer;
