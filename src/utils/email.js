// Email utility functions for AAFairShare
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Email template for settlement notifications
 */
const settlementEmailTemplate = {
  subject: "AAFairShare: Settlement Report for {{month}}",
  textBody: `
Hi there,

The settlement for {{month}} has been completed.

Summary:
- {{fromUserName}} Paid: {{fromUserTotalFormatted}}
- {{toUserName}} Paid: {{toUserTotalFormatted}}
- Total Expenses: {{totalExpensesFormatted}}
- Settlement Amount: {{fromUserName}} paid {{toUserName}} {{settlementAmountFormatted}}

The detailed expense report is attached in CSV and PDF formats.

Thanks,
AAFairShare Bot
  `.trim(),
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; line-height: 1.6; color: #333; }
  .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: 20px auto; }
  .header { font-size: 1.2em; font-weight: bold; color: #3b82f6; margin-bottom: 15px; }
  .summary-item { margin-bottom: 5px; }
  .footer { margin-top: 20px; font-size: 0.9em; color: #777; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">Settlement Report for {{month}}</div>
    <p>Hi there,</p>
    <p>The settlement for <strong>{{month}}</strong> has been completed.</p>
    <div class="summary">
      <div class="summary-item"><strong>{{fromUserName}} Paid:</strong> {{fromUserTotalFormatted}}</div>
      <div class="summary-item"><strong>{{toUserName}} Paid:</strong> {{toUserTotalFormatted}}</div>
      <div class="summary-item"><strong>Total Expenses:</strong> {{totalExpensesFormatted}}</div>
      <div class="summary-item"><strong>Settlement:</strong> {{fromUserName}} paid {{toUserName}} <strong>{{settlementAmountFormatted}}</strong></div>
    </div>
    <p>The detailed expense report is attached in CSV and PDF formats.</p>
    <div class="footer">
      Thanks,<br/>
      AAFairShare Bot
    </div>
  </div>
</body>
</html>
  `.trim()
};

/**
 * Sends a settlement email to both users involved in a settlement
 * @param {Object} params - The settlement email parameters
 * @returns {Promise} - A promise that resolves when the email is sent
 */
export async function sendSettlementEmail(params) {
  const { settlement, expenses, users, month } = params;

  // Find the users involved in the settlement
  const fromUser = users.find(u => u.id === settlement.fromUserId);
  const toUser = users.find(u => u.id === settlement.toUserId);

  if (!fromUser || !toUser) {
    throw new Error("Could not find users involved in settlement");
  }

  // Calculate totals for each user
  const fromUserTotal = expenses
    .filter(exp => exp.paidByUserId === fromUser.id)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const toUserTotal = expenses
    .filter(exp => exp.paidByUserId === toUser.id)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const totalExpenses = fromUserTotal + toUserTotal;

  // Prepare email data
  const emailData = {
    settlement: {
      ...settlement,
      date: formatDate(settlement.date),
      amount: formatCurrency(settlement.amount),
      month: formatMonthYear(month)
    },
    fromUser: {
      id: fromUser.id,
      name: fromUser.username || fromUser.email?.split('@')[0] || 'Unknown User',
      email: fromUser.email
    },
    toUser: {
      id: toUser.id,
      name: toUser.username || toUser.email?.split('@')[0] || 'Unknown User',
      email: toUser.email
    },
    expenses: expenses.map(exp => ({
      ...exp,
      date: formatDate(exp.date instanceof Date ? exp.date : new Date(exp.date)),
      amount: formatCurrency(exp.amount)
    })),
    month: formatMonthYear(month),
    // Template data for placeholders
    templateData: {
      month: formatMonthYear(month),
      fromUserName: fromUser.username || fromUser.email?.split('@')[0] || 'Unknown User',
      toUserName: toUser.username || toUser.email?.split('@')[0] || 'Unknown User',
      fromUserTotalFormatted: formatCurrency(fromUserTotal),
      toUserTotalFormatted: formatCurrency(toUserTotal),
      totalExpensesFormatted: formatCurrency(totalExpenses),
      settlementAmountFormatted: formatCurrency(settlement.amount)
    },
    template: settlementEmailTemplate
  };

  try {
    // Call the Firebase Cloud Function to send the email
    const sendEmail = httpsCallable(functions, 'sendSettlementEmail');
    await sendEmail(emailData);
    
    return {
      success: true,
      message: 'Settlement email sent successfully'
    };
  } catch (error) {
    console.error('Error sending settlement email:', error);
    return Promise.reject(error);
  }
}

/**
 * Formats a month string (YYYY-MM) to a human-readable format
 * @param {String} monthStr - The month in YYYY-MM format
 * @returns {String} - Formatted month and year (e.g., "January 2023")
 */
function formatMonthYear(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a date object to a human-readable string
 * @param {Date|string} date - The date to format
 * @returns {String} - Formatted date (e.g., "January 15, 2023")
 */
function formatDate(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Formats a currency amount
 * @param {Number} amount - The amount to format
 * @param {String} currency - The currency code (default: GBP)
 * @returns {String} - Formatted currency amount (e.g., "£123.45")
 */
function formatCurrency(amount, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency
  }).format(amount);
}