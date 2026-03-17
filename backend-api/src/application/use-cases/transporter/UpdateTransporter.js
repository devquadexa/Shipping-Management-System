const Transporter = require('../../../domain/entities/Transporter');

class UpdateTransporter {
  constructor(transporterRepository) {
    this.transporterRepository = transporterRepository;
  }

  async execute(transporterId, updateData) {
    const existingTransporter = await this.transporterRepository.findById(transporterId);
    if (!existingTransporter) {
      throw new Error('Transporter not found');
    }

    const updatedTransporter = new Transporter({
      ...existingTransporter,
      ...updateData,
      transporterId,
    });

    const validation = updatedTransporter.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.transporterRepository.update(transporterId, updatedTransporter);
  }
}

module.exports = UpdateTransporter;