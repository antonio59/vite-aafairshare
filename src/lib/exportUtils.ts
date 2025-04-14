// import { utils, writeFile } from 'xlsx'; // Remove xlsx import
import { ExpenseWithDetails, SettlementWithUsers, MonthSummary, User } from '@shared/schema';
import { formatCurrency, formatDate, formatMonthYear } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with lastAutoTable property - needed for type checking
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY?: number;
    };
  }
}

// Define ExportFormat without xlsx
type ExportFormat = 'csv' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  month: string;
  expenses: ExpenseWithDetails[];
  settlements?: SettlementWithUsers[];
  summary?: MonthSummary;
  allUsers: User[];
}

// Helper function to escape CSV fields
const escapeCsvField = (field: string | number): string => {
  const stringField = String(field);
  // If field contains comma, double quote, or newline, enclose in double quotes and escape existing double quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};


export const exportExpenses = ({ format, month, expenses, settlements = [], summary, allUsers }: ExportOptions) => {

  // Calculate the total amount of expenses
  const totalAmount = expenses.reduce((total, expense) => total + Number(expense.amount), 0);

  // Format expenses for display (keep this formatting)
  const formattedExpenses = expenses.map(expense => ({
    'Date': formatDate(expense.date),
    'Category': expense.category?.name ?? 'N/A',
    'Location': expense.location?.name ?? 'N/A',
    'Amount': formatCurrency(Number(expense.amount)), // Keep formatted currency for display consistency? Or use raw number? Let's keep formatted for now.
    'Paid By': expense.paidByUser?.username ?? 'Unknown',
    'Split': expense.splitType,
    'Description': expense.description || ''
  }));

  // Add a total row (keep this formatting)
  const totalRow = {
    'Date': '',
    'Category': '',
    'Location': 'TOTAL',
    'Amount': formatCurrency(totalAmount),
    'Paid By': '',
    'Split': '',
    'Description': ''
  };

  // Format settlements data if available (keep this)
  const formattedSettlements = settlements.map(settlement => ({
    'Date': formatDate(settlement.date),
    'Month': formatMonthYear(settlement.month),
    'From': settlement.fromUser.username,
    'To': settlement.toUser.username,
    'Amount': formatCurrency(Number(settlement.amount))
  }));

  // Get properly formatted settlement status using user names (keep this)
  let settlementStatus = "No settlement information available";
  if (summary && summary.settlementAmount > 0) {
    const fromUserId = summary.settlementDirection.fromUserId;
    const toUserId = summary.settlementDirection.toUserId;
    const fromUser = allUsers.find(user => user.id === fromUserId);
    const toUser = allUsers.find(user => user.id === toUserId);
    const fromUserName = fromUser?.username || `User ID: ${fromUserId}`;
    const toUserName = toUser?.username || `User ID: ${toUserId}`;
    settlementStatus = `${fromUserName} owes ${formatCurrency(summary.settlementAmount)} to ${toUserName}`;
  } else if (summary) {
    settlementStatus = "No settlements needed";
  }

  const fileName = `expenses-${month}`;

  // --- CSV Export Logic ---
  if (format === 'csv') {
    const headers = ['Date', 'Category', 'Location', 'Amount', 'Paid By', 'Split', 'Description'];
    const expenseRows = formattedExpenses.map(exp => headers.map(header => escapeCsvField(exp[header as keyof typeof exp])));
    const totalCsvRow = headers.map(header => escapeCsvField(totalRow[header as keyof typeof totalRow]));

    // Combine headers, expense rows, and total row
    const csvContent = [
      headers.join(','),
      ...expenseRows.map(row => row.join(',')),
      totalCsvRow.join(',')
    ].join('\n');

    // Add summary section to CSV
    let csvSummaryContent = '\n\nSummary\n';
    if (summary && allUsers.length >= 2) {
        const user1 = allUsers.find(u => u.id === Object.keys(summary.userExpenses)[0]) || allUsers[0];
        const user2 = allUsers.find(u => u.id === Object.keys(summary.userExpenses)[1]) || allUsers[1];
        const user1Expenses = summary.userExpenses[user1.id] || 0;
        const user2Expenses = summary.userExpenses[user2.id] || 0;
        csvSummaryContent += `Total Expenses,${escapeCsvField(formatCurrency(summary.totalExpenses))}\n`;
        csvSummaryContent += `${user1.username} Paid,${escapeCsvField(formatCurrency(user1Expenses))}\n`;
        csvSummaryContent += `${user2.username} Paid,${escapeCsvField(formatCurrency(user2Expenses))}\n`;
        csvSummaryContent += `Settlement Status,${escapeCsvField(settlementStatus)}\n`;
    } else {
        csvSummaryContent += 'Summary data not available\n';
    }

    // Add settlements section to CSV if available
    if (settlements.length > 0) {
        csvSummaryContent += '\nSettlements\n';
        const settlementHeaders = ['Date', 'Month', 'From', 'To', 'Amount'];
        csvSummaryContent += settlementHeaders.join(',') + '\n';
        const settlementRows = formattedSettlements.map(set => settlementHeaders.map(header => escapeCsvField(set[header as keyof typeof set])));
        csvSummaryContent += settlementRows.map(row => row.join(',')).join('\n');
    }


    const finalCsvContent = csvContent + csvSummaryContent;

    // Create Blob and trigger download
    const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up Blob URL
    } else {
        console.error("CSV download link creation failed.");
        // Fallback or error message
        alert("CSV download failed. Your browser might not support this feature.");
    }

  // --- PDF Export Logic ---
  } else if (format === 'pdf') {
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Expenses for ${formatMonthYear(month)}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
      if (summary) {
        doc.setFontSize(10);
        doc.text(`Settlement Status: ${settlementStatus}`, 14, 28);
      }

      autoTable(doc, {
        head: [['Date', 'Category', 'Location', 'Amount', 'Paid By', 'Split', 'Description']],
        body: [
          ...formattedExpenses.map(expense => [
            expense['Date'], expense['Category'], expense['Location'], expense['Amount'], expense['Paid By'], expense['Split'], expense['Description']
          ]),
          ['', '', 'TOTAL', formatCurrency(totalAmount), '', '', '']
        ],
        startY: 32,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 20 }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20 }, 6: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [['', '', 'TOTAL', formatCurrency(totalAmount), '', '', '']],
        footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
      });

      const finalY = doc.lastAutoTable.finalY || 150;

      if (summary && allUsers.length >= 2) {
        const user1 = allUsers.find(u => u.id === Object.keys(summary.userExpenses)[0]) || allUsers[0];
        const user2 = allUsers.find(u => u.id === Object.keys(summary.userExpenses)[1]) || allUsers[1];
        const user1Expenses = summary.userExpenses[user1.id] || 0;
        const user2Expenses = summary.userExpenses[user2.id] || 0;
        doc.setFontSize(14);
        doc.text('Expense Summary', 14, finalY + 15);
        autoTable(doc, {
          head: [['User', 'Amount', 'Percentage']],
          body: [
            [user1.username, formatCurrency(user1Expenses), summary.totalExpenses > 0 ? `${((user1Expenses / summary.totalExpenses) * 100).toFixed(0)}%` : '0%'],
            [user2.username, formatCurrency(user2Expenses), summary.totalExpenses > 0 ? `${((user2Expenses / summary.totalExpenses) * 100).toFixed(0)}%` : '0%'],
            ['Total', formatCurrency(summary.totalExpenses), '100%']
          ],
          startY: finalY + 20,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          footStyles: { fontStyle: 'bold', fillColor: [255, 255, 255] }
        });
      }

      if (settlements.length > 0) {
        const summaryY = doc.lastAutoTable.finalY || finalY + 40;
        doc.setFontSize(14);
        doc.text('Settlement History', 14, summaryY + 15);
        autoTable(doc, {
          head: [['Date', 'Month', 'From', 'To', 'Amount']],
          body: settlements.map(settlement => [
            formatDate(settlement.date),
            formatMonthYear(settlement.month),
            settlement.fromUser.username,
            settlement.toUser.username,
            formatCurrency(Number(settlement.amount))
          ]),
          startY: summaryY + 20,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] }
        });
      }

      doc.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      if (err instanceof Error) {
        if (err.message.includes('undefined')) {
          throw new Error("Missing data for PDF generation. Please check your data and try again.");
        }
        throw new Error(err.message || "Failed to generate PDF. Please try again.");
      }
      throw new Error("An unexpected error occurred while generating PDF.");
    }
  }
};
