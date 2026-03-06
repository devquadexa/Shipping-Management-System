class IPayItemTemplateRepository {
  async getByCategory(shipmentCategory) {
    throw new Error('Method not implemented');
  }

  async getAll() {
    throw new Error('Method not implemented');
  }

  async create(templateData) {
    throw new Error('Method not implemented');
  }

  async update(templateId, templateData) {
    throw new Error('Method not implemented');
  }

  async delete(templateId) {
    throw new Error('Method not implemented');
  }

  async reorder(shipmentCategory, items) {
    throw new Error('Method not implemented');
  }
}

module.exports = IPayItemTemplateRepository;
