class GetAllPayItemTemplates {
  constructor(payItemTemplateRepository) {
    this.payItemTemplateRepository = payItemTemplateRepository;
  }

  async execute() {
    return await this.payItemTemplateRepository.getAll();
  }
}

module.exports = GetAllPayItemTemplates;
