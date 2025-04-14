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

// Define color tuple type
type RGBColor = [number, number, number];

interface ExportOptions {
  format: ExportFormat;
  month: string;
  expenses: ExpenseWithDetails[];
  settlements?: SettlementWithUsers[];
  summary?: MonthSummary;
  allUsers: User[];
}

// Helper function to format numbers consistently
const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

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

  // Calculate the total amount of expenses with proper rounding
  const totalAmount = Number(expenses.reduce((total, expense) => total + Number(expense.amount), 0).toFixed(2));

  // Format expenses for display with proper number formatting
  const formattedExpenses = expenses.map(expense => ({
    'Date': formatDate(expense.date),
    'Category': expense.category?.name ?? 'N/A',
    'Location': expense.location?.name ?? 'N/A',
    'Amount': formatNumber(Number(expense.amount)),
    'Paid By': expense.paidByUser?.username ?? 'Unknown',
    'Split': expense.splitType,
    'Description': expense.description || ''
  }));

  // Add a total row with proper formatting
  const totalRow = {
    'Date': '',
    'Category': '',
    'Location': 'TOTAL',
    'Amount': formatNumber(totalAmount),
    'Paid By': '',
    'Split': '',
    'Description': ''
  };

  // Format settlements data with proper number formatting
  const formattedSettlements = settlements.map(settlement => ({
    'Date': formatDate(settlement.date),
    'Month': formatMonthYear(settlement.month),
    'From': settlement.fromUser.username,
    'To': settlement.toUser.username,
    'Amount': formatNumber(Number(settlement.amount))
  }));

  // Get properly formatted settlement status
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
    settlementStatus = "All expenses are settled";
  }

  const fileName = `expenses-${month}`;

  // --- CSV Export Logic ---
  if (format === 'csv') {
    const headers = ['Date', 'Category', 'Location', 'Amount', 'Paid By', 'Split', 'Description'];
    const expenseRows = formattedExpenses.map(exp => headers.map(header => escapeCsvField(exp[header as keyof typeof exp])));
    const totalCsvRow = headers.map(header => escapeCsvField(totalRow[header as keyof typeof totalRow]));

    // Start with summary section
    let csvContent = `Expenses for ${formatMonthYear(month)}\n`;
    csvContent += `Generated: ${formatDate(new Date())}\n`;
    csvContent += `Total Expenses: ${formatCurrency(totalAmount)}\n`;
    csvContent += `Settlement Status: ${settlementStatus}\n\n`;

    // Add expense details
    csvContent += [
      headers.join(','),
      ...expenseRows.map(row => row.join(',')),
      totalCsvRow.join(',')
    ].join('\n');

    // Add expense summary section
    if (summary && allUsers.length >= 2) {
      csvContent += '\n\nExpense Summary\n';
      csvContent += 'User,Amount,Percentage\n';
      
      Object.entries(summary.userExpenses).forEach(([userId, amount]) => {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
          const percentage = summary.totalExpenses > 0 ? ((amount / summary.totalExpenses) * 100).toFixed(1) : '0.0';
          csvContent += `${user.username},${formatNumber(amount)},${percentage}%\n`;
        }
      });
      
      csvContent += `Total,${formatNumber(summary.totalExpenses)},100%\n`;
    }

    // Add settlements section if available
    if (settlements.length > 0) {
      csvContent += '\nSettlement History\n';
      const settlementHeaders = ['Date', 'Month', 'From', 'To', 'Amount'];
      csvContent += settlementHeaders.join(',') + '\n';
      const settlementRows = formattedSettlements.map(set => 
        settlementHeaders.map(header => escapeCsvField(set[header as keyof typeof set]))
      );
      csvContent += settlementRows.map(row => row.join(',')).join('\n');
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      console.error("CSV download not supported");
      alert("CSV download failed. Your browser might not support this feature.");
    }

  // --- PDF Export Logic ---
  } else if (format === 'pdf') {
    try {
      const doc = new jsPDF();
      const primaryColor: RGBColor = [15, 23, 42];
      const secondaryColor: RGBColor = [51, 65, 85];
      const accentColor: RGBColor = [59, 130, 246];
      const lightGray: RGBColor = [241, 245, 249];

      // Title and Header
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Expenses for ${formatMonthYear(month)}`, 14, 20);

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Generated: ${formatDate(new Date())}`, 14, 30);

      // Total and Settlement Status
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Total Expenses: ${formatCurrency(totalAmount)}`, 14, 40);
      doc.text(`Settlement Status: ${settlementStatus}`, 14, 48);

      // Expense Table
      autoTable(doc, {
        head: [['Date', 'Category', 'Location', 'Amount', 'Paid By', 'Split', 'Description']],
        body: [
          ...formattedExpenses.map(expense => [
            expense['Date'],
            expense['Category'],
            expense['Location'],
            formatCurrency(Number(expense['Amount'])),
            expense['Paid By'],
            expense['Split'],
            expense['Description']
          ])
        ],
        foot: [['', '', 'TOTAL', formatCurrency(totalAmount), '', '', '']],
        startY: 55,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [228, 228, 231],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        footStyles: {
          fillColor: lightGray,
          textColor: primaryColor,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
      });

      // Expense Summary
      if (summary && allUsers.length >= 2) {
        const summaryY = (doc.lastAutoTable.finalY || 0) + 15;
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Expense Summary', 14, summaryY);

        const summaryData = Object.entries(summary.userExpenses).map(([userId, amount]) => {
          const user = allUsers.find(u => u.id === userId);
          const percentage = summary.totalExpenses > 0 ? ((amount / summary.totalExpenses) * 100).toFixed(1) : '0.0';
          return [
            user?.username || 'Unknown',
            formatCurrency(amount),
            `${percentage}%`
          ];
        });

        autoTable(doc, {
          head: [['User', 'Amount', 'Percentage']],
          body: summaryData,
          foot: [['Total', formatCurrency(summary.totalExpenses), '100%']],
          startY: summaryY + 5,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [228, 228, 231],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: accentColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          footStyles: {
            fillColor: lightGray,
            textColor: primaryColor,
            fontStyle: 'bold',
          },
          columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' }
          },
        });
      }

      // Settlement History
      if (settlements.length > 0) {
        const settlementY = (doc.lastAutoTable.finalY || 0) + 15;
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Settlement History', 14, settlementY);

        autoTable(doc, {
          head: [['Date', 'Month', 'From', 'To', 'Amount']],
          body: settlements.map(settlement => [
            formatDate(settlement.date),
            formatMonthYear(settlement.month),
            settlement.fromUser.username,
            settlement.toUser.username,
            formatCurrency(Number(settlement.amount))
          ]),
          startY: settlementY + 5,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [228, 228, 231],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: accentColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            4: { halign: 'right' }
          },
        });
      }

      doc.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to generate PDF");
    }
  }
};
