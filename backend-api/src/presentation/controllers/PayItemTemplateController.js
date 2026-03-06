class PayItemTemplateController {
  constructor(container) {
    this.container = container;
  }

  async getAll(req, res) {
    try {
      const getAllPayItemTemplates = this.container.resolve('getAllPayItemTemplates');
      const templates = await getAllPayItemTemplates.execute();
      res.json(templates);
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ message: 'Error fetching pay item templates', error: error.message });
    }
  }

  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const getPayItemTemplatesByCategory = this.container.resolve('getPayItemTemplatesByCategory');
      const templates = await getPayItemTemplatesByCategory.execute(category);
      res.json(templates);
    } catch (error) {
      console.error('Error in getByCategory:', error);
      res.status(500).json({ message: 'Error fetching pay item templates', error: error.message });
    }
  }

  async create(req, res) {
    try {
      const createPayItemTemplate = this.container.resolve('createPayItemTemplate');
      const template = await createPayItemTemplate.execute(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error in create:', error);
      res.status(500).json({ message: 'Error creating pay item template', error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatePayItemTemplate = this.container.resolve('updatePayItemTemplate');
      const template = await updatePayItemTemplate.execute(parseInt(id), req.body);
      res.json(template);
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({ message: 'Error updating pay item template', error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletePayItemTemplate = this.container.resolve('deletePayItemTemplate');
      await deletePayItemTemplate.execute(parseInt(id));
      res.json({ message: 'Pay item template deleted successfully' });
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({ message: 'Error deleting pay item template', error: error.message });
    }
  }
}

module.exports = PayItemTemplateController;
