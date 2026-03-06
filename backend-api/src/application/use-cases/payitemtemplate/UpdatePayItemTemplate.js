class UpdatePayItemTemplate {
  constructor(payItemTemplateRepository) {
    this.payItemTemplateRepository = payItemTemplateRepository;
  }

  async execute(templateId, templateData) {
    if (!templateData.itemName) {
      throw new Error('Item name is required');
    }
    
    return await this.payItemTemplateRepository.update(templateId, templateData);
  }
}

module.exports = UpdatePayItemTemplate;
