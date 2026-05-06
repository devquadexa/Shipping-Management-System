/**
 * Export Other Expenses Report to Excel
 */
const ExcelJS = require('exceljs');

class ExportOtherExpensesReportExcel {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(fromDate, toDate, category = null) {
    if (!fromDate || !toDate) {
      throw new Error('From date and to date are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const expenses = await this.otherExpenseRepository.findByDateRange(from, to, category);
    const summary = await this.otherExpenseRepository.getSummaryByCategory(from, to);

    if (!expenses || expenses.length === 0) {
      throw new Error('No expenses found for the selected date range');
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    const isSingleDay = fromDate === toDate;
    const dateLabel = isSingleDay
      ? `Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

    const categoryLabel = category ? ` - ${category}` : '';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Other Expenses');

    // Title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'SUPER SHINE CARGO SERVICE';
    worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF101036' }
    };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Subtitle
    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `Other Expenses Report${categoryLabel}`;
    worksheet.getCell('A2').font = { size: 12, bold: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    // Date range
    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = dateLabel;
    worksheet.getCell('A3').font = { size: 10 };
    worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };

    // Headers
    const headerRow = worksheet.getRow(5);
    const headers = ['#', 'Expense ID', 'Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Recorded By'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF101036' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 20;

    // Data rows
    expenses.forEach((exp, index) => {
      const row = worksheet.getRow(6 + index);
      row.values = [
        index + 1,
        exp.expenseId,
        fmtDate(exp.expenseDate),
        exp.category,
        exp.description,
        exp.amount,
        exp.paymentMethod || '-',
        exp.recordedByName || '-'
      ];

      // Format amount column
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(6).font = { bold: true, color: { argb: 'FF1e3a8a' } };

      // Borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Alternate row colors
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        });
      }
    });

    // Total row
    const totalRow = worksheet.getRow(6 + expenses.length);
    totalRow.values = ['', '', '', '', 'TOTAL', totalAmount, '', ''];
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(6).font = { bold: true, color: { argb: 'FF1e3a8a' } };
    totalRow.getCell(6).numFmt = '#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFF6FF' }
    };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Summary by category
    if (summary && summary.length > 0 && !category) {
      const summaryStartRow = 6 + expenses.length + 3;
      worksheet.mergeCells(`A${summaryStartRow}:H${summaryStartRow}`);
      worksheet.getCell(`A${summaryStartRow}`).value = 'Summary by Category';
      worksheet.getCell(`A${summaryStartRow}`).font = { size: 12, bold: true };
      worksheet.getCell(`A${summaryStartRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

      summary.forEach((cat, index) => {
        const row = worksheet.getRow(summaryStartRow + 1 + index);
        row.values = ['', cat.category, '', '', '', cat.totalAmount, `${cat.count} expenses`, ''];
        row.getCell(6).numFmt = '#,##0.00';
        row.getCell(6).font = { bold: true };
      });
    }

    // Column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 18;
    worksheet.getColumn(5).width = 35;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 18;
    worksheet.getColumn(8).width = 20;

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = ExportOtherExpensesReportExcel;
