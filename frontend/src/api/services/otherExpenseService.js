/**
 * Other Expense Service
 * Handles all API calls related to other expenses
 */
import apiClient from '../client';

export const otherExpenseService = {
  // Get all expenses
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    
    const queryString = params.toString();
    const url = queryString ? `/other-expenses?${queryString}` : '/other-expenses';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Create expense
  create: async (expenseData) => {
    const response = await apiClient.post('/other-expenses', expenseData);
    return response.data;
  },

  // Update expense
  update: async (expenseId, expenseData) => {
    const response = await apiClient.put(`/other-expenses/${expenseId}`, expenseData);
    return response.data;
  },

  // Delete expense
  delete: async (expenseId) => {
    const response = await apiClient.delete(`/other-expenses/${expenseId}`);
    return response.data;
  },

  // Get report data
  getReport: async (fromDate, toDate, category = null) => {
    const params = new URLSearchParams({ fromDate, toDate });
    if (category) params.append('category', category);
    
    const response = await apiClient.get(`/other-expenses/report/data?${params.toString()}`);
    return response.data;
  },

  // Export PDF
  exportPDF: async (fromDate, toDate, category = null) => {
    const params = new URLSearchParams({ fromDate, toDate });
    if (category) params.append('category', category);
    
    const response = await apiClient.get(`/other-expenses/report/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export Excel
  exportExcel: async (fromDate, toDate, category = null) => {
    const params = new URLSearchParams({ fromDate, toDate });
    if (category) params.append('category', category);
    
    const response = await apiClient.get(`/other-expenses/report/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
