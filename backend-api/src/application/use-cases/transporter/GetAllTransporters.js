class GetAllTransporters {
  constructor(transporterRepository) {
    this.transporterRepository = transporterRepository;
  }

  async execute(filters = {}) {
    return this.transporterRepository.findAll(filters);
  }
}

module.exports = GetAllTransporters;