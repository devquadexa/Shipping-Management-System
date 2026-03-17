/**
 * Office Pay Item Repository Interface
 */
class IOfficePayItemRepository {
  async create(officePayItem) {
    throw new Error('Method not implemented');
  }

  async findById(officePayItemId) {
    throw new Error('Method not implemented');
  }

  async findByJobId(jobId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async update(officePayItemId, updateData) {
    throw new Error('Method not implemented');
  }

  async delete(officePayItemId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IOfficePayItemRepository;