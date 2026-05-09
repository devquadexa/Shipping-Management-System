import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { otherExpenseService } from '../api/services/otherExpenseService';
import '../styles/OtherExpenses.css';

// Predefined expense categories
const EXPENSE_CATEGORIES = [
  'Food & Beverages',
  'Utility Bills',
  'WiFi / Internet',
  'Phone Cards',
  'Office Supplies',
  'Maintenance',
  'Transportation',
  'Other'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card'];

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

function OtherExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: getTodayDate(),
    paymentMethod: '',
    referenceNumber: '',
    notes: ''
  });

  // Check if user has access to view the page
  const hasAccess = () => {
    return user && ['Admin', 'Super Admin', 'Manager', 'Staff'].includes(user.role);
  };

  // Check if user can create expenses
  const canCreate = () => {
    return user && ['Admin', 'Super Admin', 'Manager', 'Staff'].includes(user.role);
  };

  // Check if user can edit/delete expenses (only Admin and Super Admin)
  const canEditDelete = () => {
    return user && ['Admin', 'Super Admin'].includes(user.role);
  };

  useEffect(() => {
    if (hasAccess()) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await otherExpenseService.getAll();
      setExpenses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMessage('Error loading expenses');
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await otherExpenseService.update(selectedExpense.expenseId, formData);
        setMessage('Expense updated successfully!');
      } else {
        await otherExpenseService.create(formData);
        setMessage('Expense created successfully!');
      }
      setMessageType('success');
      resetForm();
      fetchExpenses();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving expense:', error);
      setMessage(error.response?.data?.message || 'Error saving expense');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsEditing(true);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : getTodayDate(),
      paymentMethod: expense.paymentMethod || '',
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    try {
      await otherExpenseService.delete(expenseId);
      setMessage('Expense deleted successfully!');
      setMessageType('success');
      fetchExpenses();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setMessage('Error deleting expense');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      expenseDate: getTodayDate(),
      paymentMethod: '',
      referenceNumber: '',
      notes: ''
    });
    setShowModal(false);
    setIsEditing(false);
    setSelectedExpense(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-GB') : '-';
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchLower) ||
      expense.category.toLowerCase().includes(searchLower) ||
      expense.expenseId.toLowerCase().includes(searchLower) ||
      (expense.recordedByName && expense.recordedByName.toLowerCase().includes(searchLower));
    
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredExpenses.slice(indexOfFirstRecord, indexOfLastRecord);

  // Calculate total
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  if (!hasAccess()) {
    return (
      <div className="other-expenses-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="other-expenses-page">
      <div className="page-header">
        <div>
          <h1>Other Expenses</h1>
          <p>Track office expenses like food, utilities, WiFi, and phone cards</p>
        </div>
        {canCreate() && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + New Expense
          </button>
        )}
      </div>

      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>All Expenses ({filteredExpenses.length})</h2>
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="categoryFilter">Category:</label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by description, category, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>{searchTerm || categoryFilter !== 'All' ? 'No expenses found matching your filters' : 'No expenses recorded yet'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Recorded By</th>
                    {canEditDelete() && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map(expense => (
                    <tr key={expense.expenseId}>
                      <td data-label="Expense ID">
                        <span className="expense-id">{expense.expenseId}</span>
                      </td>
                      <td data-label="Date">{formatDate(expense.expenseDate)}</td>
                      <td data-label="Category">
                        <span className="category-badge">{expense.category}</span>
                      </td>
                      <td data-label="Description">{expense.description}</td>
                      <td data-label="Amount" className="amount-cell">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td data-label="Payment Method">{expense.paymentMethod || '-'}</td>
                      <td data-label="Recorded By">{expense.recordedByName || '-'}</td>
                      {canEditDelete() && (
                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(expense)}
                              title="Edit Expense"
                            >
                              Edit
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(expense.expenseId)}
                              title="Delete Expense"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Expense' : 'New Expense'}</h2>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Expense Date <span className="required">*</span></label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter expense description"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (LKR) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="">Select Method</option>
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.paymentMethod === 'Cheque' && (
                <div className="form-group">
                  <label>Cheque Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="Enter cheque number"
                  />
                </div>
              )}
              {formData.paymentMethod !== 'Cheque' && formData.paymentMethod && (
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="Transaction ID, reference number, etc."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes (optional)"
                  rows="2"
                />
              </div>

              <div className="action-buttons modal-action-buttons">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Expense' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtherExpenses;
