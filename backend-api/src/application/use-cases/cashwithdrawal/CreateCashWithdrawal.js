/**
 * Create Cash Withdrawal Use Case
 */
const CashWithdrawal = require('../../../domain/entities/CashWithdrawal');

class CreateCashWithdrawal {
  constructor(cashWithdrawalRepository, pettyCashRepository) {
    this.cashWithdrawalRepository = cashWithdrawalRepository;
    this.pettyCashRepository = pettyCashRepository;
  }

  async execute(withdrawalData, userId) {
    // Create withdrawal entity
    const withdrawal = new CashWithdrawal({
      withdrawalId: await this.cashWithdrawalRepository.generateNextId(),
      amount: withdrawalData.amount,
      bankName: withdrawalData.bankName,
      withdrawalDate: withdrawalData.withdrawalDate || new Date(),
      notes: withdrawalData.notes,
      transactionType: withdrawalData.transactionType || 'withdrawal',
      createdBy: userId
    });
    
    // Validate
    const validation = withdrawal.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Persist withdrawal
    await this.cashWithdrawalRepository.create(withdrawal);
    
    // Update petty cash balance (add the withdrawn amount)
    if (this.pettyCashRepository) {
      const currentBalance = await this.pettyCashRepository.getBalance();
      const newBalance = currentBalance + withdrawal.amount;
      await this.pettyCashRepository.updateBalance(newBalance);
    }
    
    return withdrawal;
  }
}

module.exports = CreateCashWithdrawal;
