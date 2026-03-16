class TransporterController {
  constructor(container) {
    this.createTransporter = container.get('createTransporter');
    this.getAllTransporters = container.get('getAllTransporters');
    this.updateTransporter = container.get('updateTransporter');
    this.deleteTransporter = container.get('deleteTransporter');
    this.transporterRepository = container.get('transporterRepository');
  }

  async create(req, res) {
    try {
      const transporter = await this.createTransporter.execute(req.body);
      res.status(201).json(transporter);
    } catch (error) {
      console.error('Create transporter error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const transporters = await this.getAllTransporters.execute(req.query);
      res.json(transporters);
    } catch (error) {
      console.error('Get transporters error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getById(req, res) {
    try {
      const transporter = await this.transporterRepository.findById(req.params.id);
      if (!transporter) {
        return res.status(404).json({ message: 'Transporter not found' });
      }

      res.json(transporter);
    } catch (error) {
      console.error('Get transporter error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async update(req, res) {
    try {
      const transporter = await this.updateTransporter.execute(req.params.id, req.body);
      res.json(transporter);
    } catch (error) {
      console.error('Update transporter error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await this.deleteTransporter.execute(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Delete transporter error:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = TransporterController;