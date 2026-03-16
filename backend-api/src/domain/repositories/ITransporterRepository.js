class ITransporterRepository {
  async create(transporter) {
    throw new Error('Method not implemented');
  }

  async findById(transporterId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async update(transporterId, transporter) {
    throw new Error('Method not implemented');
  }

  async delete(transporterId) {
    throw new Error('Method not implemented');
  }

  async exists(transporterId) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = ITransporterRepository;