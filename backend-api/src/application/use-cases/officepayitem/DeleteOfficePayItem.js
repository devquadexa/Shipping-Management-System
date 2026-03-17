/**
 * Delete Office Pay Item Use Case
 */
class DeleteOfficePayItem {
  constructor(officePayItemRepository) {
    this.officePayItemRepository = officePayItemRepository;
  }

  async execute(officePayItemId) {
    try {
      console.log('DeleteOfficePayItem.execute - officePayItemId:', officePayItemId);
      
      // Check if item exists
      const existingItem = await this.officePayItemRepository.findById(officePayItemId);
      if (!existingItem) {
        throw new Error('Office pay item not found');
      }
      
      // Delete
      await this.officePayItemRepository.delete(officePayItemId);
      
      console.log('DeleteOfficePayItem.execute - SUCCESS');
      return true;
    } catch (error) {
      console.error('DeleteOfficePayItem.execute - ERROR:', error);
      throw error;
    }
  }
}

module.exports = DeleteOfficePayItem;