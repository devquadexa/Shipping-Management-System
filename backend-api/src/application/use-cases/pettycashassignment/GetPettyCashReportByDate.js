/**
 * Get Petty Cash Report by Date Range
 * Retrieves all petty cash assignments between fromDate and toDate (inclusive)
 */
class GetPettyCashReportByDate {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(fromDate, toDate) {
    if (!fromDate) throw new Error('From date is required');

    // If toDate not supplied, default to same as fromDate (single-day behaviour)
    const effectiveTo = toDate || fromDate;

    const from = new Date(fromDate);
    const to   = new Date(effectiveTo);

    if (isNaN(from.getTime())) throw new Error('Invalid from date. Use YYYY-MM-DD');
    if (isNaN(to.getTime()))   throw new Error('Invalid to date. Use YYYY-MM-DD');
    if (from > to)             throw new Error('From date must be on or before to date');

    const rows = await this.pettyCashAssignmentRepository.findByDateRange(from, to);

    if (!rows || rows.length === 0) return [];

    return rows.map(row => ({
      assignmentId:   row.assignmentId,
      jobId:          row.jobId,
      customerId:     row.customerId,
      customerName:   row.customerName   || '-',
      assignedToName: row.assignedToName || '-',
      assignedByName: row.assignedByName || '-',
      assignedAmount: parseFloat(row.assignedAmount) || 0,
      settledAmount:  parseFloat(row.settledAmount)  || 0,
      balanceAmount:  parseFloat(row.balanceAmount)  || 0,
      overAmount:     parseFloat(row.overAmount)     || 0,
      status:         row.status         || 'Assigned',
      assignmentDate: row.assignedDate,
      settlementDate: row.settlementDate,
      assignmentCount: parseInt(row.assignmentCount) || 1,
      notes:          row.notes          || ''
    }));
  }
}

module.exports = GetPettyCashReportByDate;
