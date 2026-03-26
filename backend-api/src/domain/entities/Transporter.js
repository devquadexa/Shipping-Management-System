/**
 * Transporter Domain Entity
 */
class Transporter {
  constructor({
    transporterId,
    name,
    mainPhone,
    phone,
    contactPerson,
    email,
    registrationDate = new Date(),
    addressNumber,
    addressStreet1,
    addressStreet2,
    addressDistrict,
    addressCity,
    addressCountry = 'Sri Lanka',
    contactPersons = [],
    address,
    vehicleNumber,
    notes,
    createdDate = new Date(),
    isActive = true,
  }) {
    this.transporterId = transporterId;
    this.name = name;
    this.mainPhone = mainPhone || phone;
    this.phone = this.mainPhone;
    this.contactPerson = contactPerson;
    this.email = email;
    this.registrationDate = registrationDate;
    this.addressNumber = addressNumber;
    this.addressStreet1 = addressStreet1;
    this.addressStreet2 = addressStreet2;
    this.addressDistrict = addressDistrict;
    this.addressCity = addressCity;
    this.addressCountry = addressCountry;
    this.contactPersons = contactPersons;
    this.address = address;
    this.vehicleNumber = vehicleNumber;
    this.notes = notes;
    this.createdDate = createdDate;
    this.isActive = isActive;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Transporter name is required');
    } else if (!/^[a-zA-Z\s-]+$/.test(this.name.trim())) {
      errors.push('Transporter name can only contain letters, spaces, and hyphens (-)');
    }

    if (!this.mainPhone || this.mainPhone.trim().length === 0) {
      errors.push('Main phone number is required');
    } else if (!/^\d{10}$/.test(this.mainPhone.replace(/\s/g, ''))) {
      errors.push('Main phone number must be exactly 10 digits');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.addressNumber || this.addressNumber.trim().length === 0) {
      errors.push('Address number is required');
    }

    if (!this.addressStreet1 || this.addressStreet1.trim().length === 0) {
      errors.push('Street name 1 is required');
    }

    if (!this.addressDistrict || this.addressDistrict.trim().length === 0) {
      errors.push('District is required');
    }

    if (!this.addressCity || this.addressCity.trim().length === 0) {
      errors.push('City/Town is required');
    }

    if (!this.addressCountry || this.addressCountry.trim().length === 0) {
      errors.push('Country is required');
    }

    const validContactPersons = (this.contactPersons || []).filter(
      (contactPerson) => contactPerson.name?.trim() || contactPerson.phone?.trim() || contactPerson.email?.trim()
    );

    if (validContactPersons.length === 0) {
      errors.push('At least one contact person is required');
    }

    if (validContactPersons.length > 2) {
      errors.push('Maximum 2 contact persons allowed');
    }

    validContactPersons.forEach((contactPerson, index) => {
      if (!contactPerson.name || contactPerson.name.trim().length === 0) {
        errors.push(`Contact person ${index + 1}: Name is required`);
      }

      if (!contactPerson.phone || contactPerson.phone.trim().length === 0) {
        errors.push(`Contact person ${index + 1}: Phone is required`);
      }

      if (contactPerson.email && !this.isValidEmail(contactPerson.email)) {
        errors.push(`Contact person ${index + 1}: Email must be valid`);
      }
    });

    if (validContactPersons.length > 0) {
      this.contactPerson = validContactPersons[0].name;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getFormattedAddress() {
    return [
      this.addressNumber,
      this.addressStreet1,
      this.addressStreet2,
      this.addressDistrict,
      this.addressCity,
      this.addressCountry,
    ]
      .filter(Boolean)
      .join(', ');
  }

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }
}

module.exports = Transporter;