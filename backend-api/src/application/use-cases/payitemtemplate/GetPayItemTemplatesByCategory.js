class GetPayItemTemplatesByCategory {
  constructor(payItemTemplateRepository) {
    this.payItemTemplateRepository = payItemTemplateRepository;
  }

  async execute(shipmentCategory) {
    return await this.payItemTemplateRepository.getByCategory(shipmentCategory);
  }
}

module.exports = GetPayItemTemplatesByCategory;
