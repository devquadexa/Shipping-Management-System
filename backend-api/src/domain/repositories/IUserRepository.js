/**
 * User Repository Interface
 */
class IUserRepository {
  async create(user) {
    throw new Error('Method not implemented');
  }

  async findById(userId) {
    throw new Error('Method not implemented');
  }

  async findByUsername(username) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async update(userId, user) {
    throw new Error('Method not implemented');
  }

  async delete(userId) {
    throw new Error('Method not implemented');
  }

  async authenticate(username, password) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
