// Define shared types or interfaces used within functions
// Example: Email Template Structure

export interface EmailTemplate {
  id: string; // Document ID (e.g., 'settlementNotification')
  subject?: string; // e.g., "FairShare Settlement Report - {{month}}"
  htmlBody?: string; // HTML content with placeholders like {{variableName}}
  textBody?: string; // Plain text content with placeholders
}

// Add other function-specific types here if needed
