class DeletePayItemTemplate {
  constructor(payItemTemplateRepository) {
    this.payItemTemplateRepository = payItemTemplateRepository;
  }

  async execute(templateId) {
    return await this.payItemTemplateRepository.delete(templateId);
  }
}

module.exports = DeletePayItemTemplate;
