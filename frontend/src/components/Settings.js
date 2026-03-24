import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Settings.css';
import API_BASE from '../api/config';

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payitems');
  const [templates, setTemplates] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('LCL');
  const [message, setMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const defaultCategories = ['LCL', 'FCL', 'Air Freight', 'BOI', 'Vehicle - Personal', 'Vehicle - Company', 'TIEP'];
  const categories = [...new Set([...defaultCategories, ...Object.keys(templates || {})])];

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      fetchTemplates();
    }
  }, [user]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [selectedCategory, categories]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pay-item-templates/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage('Error loading pay item templates');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      setMessage('Please enter an item name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/pay-item-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shipmentCategory: selectedCategory,
          itemName: newItemName
        })
      });

      if (response.ok) {
        setMessage('Pay item added successfully!');
        setNewItemName('');
        setShowAddModal(false);
        fetchTemplates();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error adding pay item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setMessage('Error adding pay item');
    }
  };

  const handleUpdateItem = async (templateId) => {
    if (!editingItem?.itemName.trim()) {
      setMessage('Please enter an item name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/pay-item-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemName: editingItem.itemName
        })
      });

      if (response.ok) {
        setMessage('Pay item updated successfully!');
        setEditingItem(null);
        fetchTemplates();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error updating pay item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setMessage('Error updating pay item');
    }
  };

  const handleDeleteItem = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this pay item?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/pay-item-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessage('Pay item deleted successfully!');
        fetchTemplates();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error deleting pay item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setMessage('Error deleting pay item');
    }
  };

  if (user?.role === 'Waff Clerk') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Admin or Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure system settings and defaults</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === 'payitems' ? 'active' : ''}`}
            onClick={() => setActiveTab('payitems')}
          >
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </span>
            Pay Items
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'payitems' && (
            <div className="pay-items-settings">
              <div className="settings-header">
                <h2>Default Pay Items by Shipment Category</h2>
                <p>Define default pay items that will be automatically loaded when creating invoices</p>
              </div>

              <div className="category-tabs">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                    <span className="item-count">
                      {templates[category]?.length || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pay-items-list-container">
                <div className="list-header">
                  <h3>{selectedCategory} - Pay Items</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add Item
                  </button>
                </div>

                {templates[selectedCategory] && templates[selectedCategory].length > 0 ? (
                  <div className="pay-items-grid">
                    {templates[selectedCategory].map((item, index) => (
                      <div key={item.templateId} className="pay-item-card">
                        <div className="item-number">{index + 1}</div>
                        {editingItem?.templateId === item.templateId ? (
                          <div className="item-edit-form">
                            <input
                              type="text"
                              value={editingItem.itemName}
                              onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                              className="item-name-input"
                              autoFocus
                            />
                            <div className="item-actions">
                              <button
                                className="btn-save"
                                onClick={() => handleUpdateItem(item.templateId)}
                              >
                                Save
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={() => setEditingItem(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="item-name">{item.itemName}</div>
                            <div className="item-actions">
                              <button
                                className="btn-edit-small"
                                onClick={() => setEditingItem(item)}
                                title="Edit"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                className="btn-delete-small"
                                onClick={() => handleDeleteItem(item.templateId)}
                                title="Delete"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </div>
                    <p>No pay items defined for {selectedCategory}</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Pay Item to {selectedCategory}</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter pay item name"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem();
                    }
                  }}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddItem}>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;


