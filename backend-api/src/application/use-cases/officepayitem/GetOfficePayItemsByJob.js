/**
 * Get Office Pay Items by Job Use Case
 */
class GetOfficePayItemsByJob {
  constructor(officePayItemRepository) {
    this.officePayItemRepository = officePayItemRepository;
  }

  async execute(jobId) {
    try {
      console.log('GetOfficePayItemsByJob.execute - jobId:', jobId);
      
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      const items = await this.officePayItemRepository.findByJobId(jobId);
      
      console.log('GetOfficePayItemsByJob.execute - found items:', items.length);
      return items;
    } catch (error) {
      console.error('GetOfficePayItemsByJob.execute - ERROR:', error);
      throw error;
    }
  }
}

module.exports = GetOfficePayItemsByJob;