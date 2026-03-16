/**
 * Replace Pay Items for Job Use Case
 * Replaces all existing pay items with new ones
 */
class ReplacePayItems {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId, payItemsData, userId) {
    const job = await this.jobRepository.findById(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Validate pay items
    for (const item of payItemsData) {
      if (!item.description || !item.amount || item.amount <= 0) {
        throw new Error(`Invalid pay item data: ${item.description}`);
      }
      if (!item.billingAmount || item.billingAmount <= 0) {
        throw new Error(`Invalid billing amount for: ${item.description}`);
      }
    }
    
    // Replace all pay items through repository
    await this.jobRepository.replacePayItems(jobId, payItemsData, userId);
    
    return await this.jobRepository.findById(jobId);
  }
}

module.exports = ReplacePayItems;
