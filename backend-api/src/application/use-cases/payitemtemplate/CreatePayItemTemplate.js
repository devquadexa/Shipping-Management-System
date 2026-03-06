class CreatePayItemTemplate {
  constructor(payItemTemplateRepository) {
    this.payItemTemplateRepository = payItemTemplateRepository;
  }

  async execute(templateData) {
    if (!templateData.shipmentCategory || !templateData.itemName) {
      throw new Error('Shipment category and item name are required');
    }
    
    return await this.payItemTemplateRepository.create(templateData);
  }
}

module.exports = CreatePayItemTemplate;
