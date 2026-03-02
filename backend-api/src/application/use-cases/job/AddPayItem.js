/**
 * Add Pay Item to Job Use Case
 */
class AddPayItem {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId, payItemData, userId) {
    const job = await this.jobRepository.findById(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Validate pay item
    if (!payItemData.description || !payItemData.amount || payItemData.amount <= 0) {
      throw new Error('Invalid pay item data');
    }
    
    // Persist through repository
    const payItemId = `PI${Date.now()}`;
    await this.jobRepository.addPayItem(jobId, {
      payItemId,
      description: payItemData.description,
      amount: payItemData.amount,
      billingAmount: payItemData.billingAmount || payItemData.amount,
      addedBy: userId
    });
    
    return await this.jobRepository.findById(jobId);
  }
}

module.exports = AddPayItem;
