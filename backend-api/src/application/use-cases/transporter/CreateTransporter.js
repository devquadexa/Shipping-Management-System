const Transporter = require('../../../domain/entities/Transporter');

class CreateTransporter {
  constructor(transporterRepository) {
    this.transporterRepository = transporterRepository;
  }

  async execute(transporterData) {
    const transporter = new Transporter({
      transporterId: await this.transporterRepository.generateNextId(),
      ...transporterData,
    });

    const validation = transporter.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    if (transporter.email) {
      const existingTransporter = await this.transporterRepository.findByEmail(transporter.email);
      if (existingTransporter) {
        throw new Error('Transporter with this email already exists');
      }
    }

    return this.transporterRepository.create(transporter);
  }
}

module.exports = CreateTransporter;