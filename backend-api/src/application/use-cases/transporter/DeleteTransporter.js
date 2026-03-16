class DeleteTransporter {
  constructor(transporterRepository) {
    this.transporterRepository = transporterRepository;
  }

  async execute(transporterId) {
    const exists = await this.transporterRepository.exists(transporterId);
    if (!exists) {
      throw new Error('Transporter not found');
    }

    await this.transporterRepository.delete(transporterId);
    return { message: 'Transporter deleted successfully' };
  }
}

module.exports = DeleteTransporter;