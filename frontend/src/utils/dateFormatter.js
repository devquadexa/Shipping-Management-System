/**
 * Utility functions for consistent date formatting across the application
 * All dates are formatted as DD/MM/YYYY
 */

/**
 * Format a date to DD/MM/YYYY format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date with time to DD/MM/YYYY HH:MM format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date-time string or '-' if invalid
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format a date with month name to DD MMM YYYY format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDateWithMonth = (date) => {
  if (!date) return '-';
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleDateString('en-GB', { month: 'short' });
  const year = parsed.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Format a date with full month name to DD MMMM YYYY format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDateWithFullMonth = (date) => {
  if (!date) return '-';
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '-';
  
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleDateString('en-GB', { month: 'long' });
  const year = parsed.getFullYear();
  
  return `${day} ${month} ${year}`;
};
