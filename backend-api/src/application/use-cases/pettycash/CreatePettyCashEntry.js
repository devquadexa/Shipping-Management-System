/**
 * Create Petty Cash Entry Use Case
 */
const PettyCashEntry = require('../../../domain/entities/PettyCashEntry');

class CreatePettyCashEntry {
  constructor(pettyCashRepository) {
    this.pettyCashRepository = pettyCashRepository;
  }

  async execute(entryData, userId) {
    // Get current balance
    const currentBalance = await this.pettyCashRepository.getBalance();
    
    // Create entry entity
    const entry = new PettyCashEntry({
      entryId: await this.pettyCashRepository.generateNextId(),
      description: entryData.description,
      amount: entryData.amount,
      entryType: entryData.entryType,
      jobId: entryData.jobId || null,
      createdBy: userId
    });
    
    // Validate
    const validation = entry.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Calculate new balance
    const newBalance = currentBalance + entry.getImpactOnBalance();
    
    if (newBalance < 0) {
      throw new Error('Insufficient petty cash balance');
    }
    
    entry.balanceAfter = newBalance;
    
    // Persist entry
    await this.pettyCashRepository.createEntry(entry);
    
    // Update balance
    await this.pettyCashRepository.updateBalance(newBalance);
    
    return entry;
  }
}

module.exports = CreatePettyCashEntry;
