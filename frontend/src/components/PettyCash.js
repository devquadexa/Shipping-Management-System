import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { authService } from '../api/services/authService';
import { customerService } from '../api/services/customerService';
import '../styles/PettyCash.css';
import API_BASE from '../api/config';

function PettyCash() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [invoicedJobIds, setInvoicedJobIds] = useState(new Set()); // Track jobs with invoices
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [overallBalance, setOverallBalance] = useState(0);
  const [userBalances, setUserBalances] = useState({});
  const [jobAssignments, setJobAssignments] = useState({}); // Store job assignments
  
  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    jobId: '',
    assignedTo: '',
    assignedAmount: '',
    notes: ''
  });

  // Settlement Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [settlementItems, setSettlementItems] = useState([]);
  
  // Edit settlement item states
  const [editingSettlementItem, setEditingSettlementItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editActualCost, setEditActualCost] = useState('');
  const [canEditSettlement, setCanEditSettlement] = useState(false);

  // Edit Settlement Modal (new - for editing from main table)
  const [showEditSettlementModal, setShowEditSettlementModal] = useState(false);
  const [editSettlementItems, setEditSettlementItems] = useState([]);

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Dropdown menu state
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Inline edit state for settlement items in expanded rows
  const [inlineEditingItem, setInlineEditingItem] = useState(null); // { assignmentId, itemId }
  const [inlineEditName, setInlineEditName] = useState('');
  const [inlineEditCost, setInlineEditCost] = useState('');
  const [inlineAddingRow, setInlineAddingRow] = useState(null); // assignmentId
  const [inlineNewItem, setInlineNewItem] = useState({ itemName: '', actualCost: '', hasBill: false });

  // Cash Balance Settlement Modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementFormData, setSettlementFormData] = useState({
    settlementType: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssignments();
    fetchJobs();
    fetchCustomers();
    fetchInvoicedJobs();
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
      fetchUsers();
      fetchOverallBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.actions-dropdown')) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const fetchAssignments = async () => {
    try {
      // Use regular endpoint - the component already has grouping logic
      const endpoint = user?.role === 'Waff Clerk' 
        ? `${API_BASE}/api/petty-cash-assignments/my`
        : `${API_BASE}/api/petty-cash-assignments`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch assignments:', response.status);
        setAssignments([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched assignments:', data);
      if (Array.isArray(data)) {
        data.forEach(a => console.log(`  >> Assignment ${a.assignmentId}: status=${a.status}, groupId=${a.groupId}`));
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAssignments(data);
        
        // For admin/super admin, fetch user balances from dedicated endpoint
        if (user?.role === 'Admin' || user?.role === 'Super Admin') {
          fetchUserBalances();
        }
      } else {
        console.error('Assignments data is not an array:', data);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const fetchUserBalances = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments/user-balances`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user balances:', data);
        
        // Convert array to object keyed by userId
        const balancesMap = {};
        data.forEach(balance => {
          balancesMap[balance.userId] = balance;
        });
        setUserBalances(balancesMap);
      }
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  };

  const fetchOverallBalance = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/petty-cash/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverallBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching overall balance:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      console.log('Fetched jobs:', data);
      console.log('Jobs with pettyCashStatus:', data.map(j => ({ 
        jobId: j.jobId, 
        pettyCashStatus: j.pettyCashStatus,
        assignedUsers: j.assignedUsers
      })));
      setJobs(data);
      
      // Build job assignments map from the assignedUsers in each job
      if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
        const assignmentsMap = {};
        data.forEach(job => {
          if (job.assignedUsers && job.assignedUsers.length > 0) {
            assignmentsMap[job.jobId] = job.assignedUsers;
          } else {
            assignmentsMap[job.jobId] = [];
          }
        });
        console.log('Job assignments map:', assignmentsMap);
        setJobAssignments(assignmentsMap);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data.filter(u => u.role === 'Waff Clerk'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  // Check if invoice has been generated for a job
  const checkInvoiceGenerated = async (jobId) => {
    // First check the cached set
    if (invoicedJobIds.has(jobId)) return true;
    try {
      const response = await fetch(`${API_BASE}/api/billing`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const bills = await response.json();
        const jobBill = bills.find(bill => bill.jobId === jobId);
        return !!jobBill;
      }
      return false;
    } catch (error) {
      console.error('Error checking invoice:', error);
      return false;
    }
  };

  // Fetch all invoiced job IDs upfront so UI can hide edit buttons without async calls
  const fetchInvoicedJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/billing`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const bills = await response.json();
        setInvoicedJobIds(new Set(bills.map(b => b.jobId)));
      }
    } catch (error) {
      console.error('Error fetching invoiced jobs:', error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.name : customerId;
  };

  // Removed unused getUserName function

  const closedAssignmentStatuses = [
    'Settled',
    'Settled/Approved',
    'Settled/Rejected',
    'Balance Returned',
    'Overdue Collected',
    'Returned',
    'Paid'
  ];

  const isActiveAssignment = (assignment) => !closedAssignmentStatuses.includes(assignment.status);

  // Show all jobs that have assigned users.
  // Availability for assignment is determined per-user by active (non-settled) petty cash entries.
  const getAvailableJobs = () => {
    return jobs.filter(job => {
      if (!jobAssignments[job.jobId] || jobAssignments[job.jobId].length === 0) {
        return false;
      }

      const jobPettyCashAssignments = assignments.filter(a => a.jobId === job.jobId);
      const hasAssignments = jobPettyCashAssignments.length > 0;
      const allAssignmentsClosed = hasAssignments && jobPettyCashAssignments.every(a => !isActiveAssignment(a));
      const isJobMarkedSettled = job.pettyCashStatus === 'Settled';

      // Do not show jobs that are already fully settled in petty cash flow.
      if (allAssignmentsClosed || isJobMarkedSettled) {
        return false;
      }

      return true;
    });
  };

  const getAvailableUsersForJob = (jobId) => {
    console.log('getAvailableUsersForJob called with jobId:', jobId);
    console.log('jobAssignments:', jobAssignments);
    console.log('users:', users);
    console.log('assignments:', assignments);
    
    if (!jobId || !jobAssignments[jobId]) {
      console.log('No job selected or no assignments found');
      return [];
    }
    
    // Get all users assigned to this job
    const assignedUserIds = jobAssignments[jobId].map(assignment => assignment.userId);
    console.log('Assigned user IDs for job:', assignedUserIds);

    // Allow multiple petty cash assignments to the same user for the same job.
    const availableUsers = users.filter(user => assignedUserIds.includes(user.userId));
    console.log('Available users (all users assigned to job):', availableUsers);
    
    return availableUsers;
  };

  const sanitizeCurrencyInput = (value) => {
    const cleaned = String(value || '').replace(/[^\d.]/g, '');
    const [integerPart, ...decimalParts] = cleaned.split('.');
    const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '');
    const decimalPart = decimalParts.join('').slice(0, 2);

    if (cleaned.includes('.')) {
      return `${normalizedInteger || '0'}.${decimalPart}`;
    }

    return normalizedInteger;
  };

  const handleAssignedAmountChange = (e) => {
    const sanitizedAmount = sanitizeCurrencyInput(e.target.value);
    setAssignFormData({ ...assignFormData, assignedAmount: sanitizedAmount });
  };

  const handleAssignedAmountKeyDown = (e) => {
    const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedControlKeys.includes(e.key)) {
      return;
    }

    const isDigit = /^\d$/.test(e.key);
    const isDecimalPoint = e.key === '.';
    const hasDecimalPoint = String(assignFormData.assignedAmount || '').includes('.');

    if (!isDigit && !(isDecimalPoint && !hasDecimalPoint)) {
      e.preventDefault();
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignFormData.jobId || !assignFormData.assignedTo || !assignFormData.assignedAmount) {
      setMessage('Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const assignedAmountText = String(assignFormData.assignedAmount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(assignedAmountText)) {
      setMessage('Assigned amount must be a valid number');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const assignedAmount = parseFloat(assignedAmountText);
    if (Number.isNaN(assignedAmount) || assignedAmount <= 0) {
      setMessage('Assigned amount must be greater than 0');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...assignFormData,
          assignedAmount
        })
      });

      if (response.ok) {
        setMessage('Petty cash assigned successfully!');
        setShowAssignModal(false);
        setAssignFormData({ jobId: '', assignedTo: '', assignedAmount: '', notes: '' });
        fetchAssignments();
        fetchJobs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error assigning petty cash');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error assigning petty cash:', error);
      setMessage('Error assigning petty cash');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const openSettleModal = async (assignment) => {
    console.log('Opening settle modal for assignment:', assignment);
    setSelectedAssignment(assignment);
    
    // Load existing settlement items for THIS assignment
    let existingItems = [];
    try {
      const existingResponse = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignment.assignmentId}/settlement-items`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (existingResponse.ok) {
        existingItems = await existingResponse.json();
        console.log('Existing settlement items for this assignment:', existingItems);
      }
    } catch (error) {
      console.error('Error loading existing settlement items:', error);
    }
    
    // Get read-only predefined items from the backend response
    let readOnlyPredefinedItems = [];
    try {
      const job = jobs.find(j => j.jobId === assignment.jobId);
      if (job) {
        const assignmentResponse = await fetch(
          `${API_BASE}/api/petty-cash-assignments/job/${assignment.jobId}?assignmentId=${assignment.assignmentId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (assignmentResponse.ok) {
          const jobAssignment = await assignmentResponse.json();
          console.log('Job assignment:', jobAssignment);
          console.log('Read-only predefined items:', jobAssignment.readOnlyPredefinedItems);
          
          // Get read-only items from backend
          if (jobAssignment && jobAssignment.readOnlyPredefinedItems) {
            readOnlyPredefinedItems = jobAssignment.readOnlyPredefinedItems;
          }
        }
      }
    } catch (error) {
      console.error('Error loading job assignment:', error);
    }
    
    // Load pay item templates for this job's category
    try {
      const job = jobs.find(j => j.jobId === assignment.jobId);
      console.log('Found job:', job);
      console.log('Job shipment category:', job?.shipmentCategory);
      
      if (job && job.shipmentCategory) {
        console.log('Fetching templates for category:', job.shipmentCategory);
        const response = await fetch(
          `${API_BASE}/api/pay-item-templates/category/${encodeURIComponent(job.shipmentCategory)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        console.log('Template response status:', response.status);
        
        if (response.ok) {
          const templates = await response.json();
          console.log('Loaded templates:', templates);
          
          if (templates && templates.length > 0) {
            // Convert templates to pay items format
            // Mark items as paid if they exist in readOnlyPredefinedItems
            const loadedPayItems = templates.map(template => {
              const existingItem = existingItems.find(ei => ei.itemName === template.itemName);
              const paidByOther = readOnlyPredefinedItems.find(si => si.itemName === template.itemName);
              
              if (existingItem) {
                // This Waff Clerk already paid for this item
                return {
                  itemName: template.itemName,
                  actualCost: existingItem.actualCost,
                  isCustomItem: false,
                  assignmentId: existingItem.assignmentId,
                  paidBy: existingItem.paidBy,
                  paidByName: existingItem.paidByName,
                  hasBill: existingItem.hasBill ? true : false,
                  alreadyPaid: true
                };
              } else if (paidByOther) {
                // Another Waff Clerk already paid for this item (read-only)
                return {
                  itemName: template.itemName,
                  actualCost: paidByOther.actualCost,
                  isCustomItem: false,
                  assignmentId: paidByOther.assignmentId,
                  paidBy: paidByOther.paidBy,
                  paidByName: paidByOther.paidByName,
                  hasBill: paidByOther.hasBill ? true : false,
                  alreadyPaid: true,
                  paidByOther: true
                };
              }
              return {
                itemName: template.itemName,
                actualCost: '',
                isCustomItem: false,
                hasBill: false,
                alreadyPaid: false
              };
            });
            
            // Add custom items from existing settlement
            const customItems = existingItems
              .filter(ei => ei.isCustomItem)
              .map(ei => ({
                itemName: ei.itemName,
                actualCost: ei.actualCost,
                isCustomItem: true,
                assignmentId: ei.assignmentId,
                paidBy: ei.paidBy,
                paidByName: ei.paidByName,
                hasBill: ei.hasBill ? true : false,
                alreadyPaid: true
              }));
            
            const finalPayItems = [...loadedPayItems, ...customItems];
            console.log('Final pay items:', finalPayItems);
            setSettlementItems(finalPayItems);
            setShowSettleModal(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    
    // Fallback: just show existing items
    setSettlementItems(existingItems);
    setShowSettleModal(true);
  };

  // Open Edit Settlement Modal (from main table action button)
  const openEditSettlementModal = async (assignment) => {
    console.log('Opening edit settlement modal for assignment:', assignment.assignmentId);
    setSelectedAssignment(assignment);
    
    // Load existing settlement items
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignment.assignmentId}/settlement-items`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const items = await response.json();
        console.log('Loaded settlement items for editing:', items);
        setEditSettlementItems(items);
        setShowEditSettlementModal(true);
      } else {
        setMessage('❌ Failed to load settlement items');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error loading settlement items:', error);
      setMessage('❌ Error loading settlement items');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditSettlementItemChange = (index, field, value) => {
    const newItems = editSettlementItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setEditSettlementItems(newItems);
  };

  const addNewSettlementItem = () => {
    setEditSettlementItems([...editSettlementItems, { 
      itemName: '', 
      actualCost: '', 
      isCustomItem: true, 
      hasBill: false,
      isNew: true // Mark as new item
    }]);
  };

  const removeEditSettlementItem = (index) => {
    if (editSettlementItems.length > 1) {
      setEditSettlementItems(editSettlementItems.filter((_, i) => i !== index));
    } else {
      setMessage('❌ Cannot remove the last item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const saveAllSettlementChanges = async () => {
    try {
      // Validate all items
      const validItems = editSettlementItems.filter(item => 
        item.itemName && item.actualCost && parseFloat(item.actualCost) > 0
      );
      
      if (validItems.length === 0) {
        setMessage('❌ Please add at least one valid item');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Process each item
      for (const item of validItems) {
        if (item.isNew) {
          // Add new item via settle endpoint (append mode)
          await fetch(
            `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settle`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                items: [{
                  itemName: item.itemName,
                  actualCost: parseFloat(item.actualCost),
                  isCustomItem: true,
                  hasBill: item.hasBill ? true : false
                }]
              })
            }
          );
        } else if (item.settlementItemId) {
          // Update existing item
          await fetch(
            `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${item.settlementItemId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                itemName: item.itemName,
                actualCost: parseFloat(item.actualCost)
              })
            }
          );
        }
      }

      setMessage('✅ Settlement items updated successfully');
      setShowEditSettlementModal(false);
      setEditSettlementItems([]);
      setSelectedAssignment(null);
      fetchAssignments(); // Reload assignments
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settlement changes:', error);
      setMessage('❌ Error saving changes');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteEditSettlementItem = async (item) => {
    if (!item.settlementItemId) {
      // Just remove from list if it's a new unsaved item
      removeEditSettlementItem(editSettlementItems.indexOf(item));
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${item.itemName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${item.settlementItemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setMessage('✅ Item deleted successfully');
        // Remove from local state
        setEditSettlementItems(editSettlementItems.filter(i => i.settlementItemId !== item.settlementItemId));
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || 'Error deleting item'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting settlement item:', error);
      setMessage('❌ Error deleting item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSettlementItemChange = (index, field, value) => {
    const newItems = settlementItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSettlementItems(newItems);
  };

  const addSettlementItem = () => {
    setSettlementItems([...settlementItems, { itemName: '', actualCost: '', isCustomItem: true, hasBill: false }]);
  };
  
  // Start editing a settlement item
  const startEditSettlementItem = (item) => {
    setEditingSettlementItem(item.settlementItemId);
    setEditItemName(item.itemName);
    setEditActualCost(item.actualCost.toString());
  };
  
  // Cancel editing
  const cancelEditSettlementItem = () => {
    setEditingSettlementItem(null);
    setEditItemName('');
    setEditActualCost('');
  };
  
  // Save edited settlement item
  const saveEditedSettlementItem = async () => {
    if (!editItemName || !editActualCost) {
      setMessage('❌ Please fill in all fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    const cost = parseFloat(editActualCost);
    if (isNaN(cost) || cost <= 0) {
      setMessage('❌ Please enter a valid amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${editingSettlementItem}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            itemName: editItemName,
            actualCost: cost
          })
        }
      );
      
      if (response.ok) {
        setMessage('✅ Settlement item updated successfully');
        
        // Reload settlement items
        const itemsResponse = await fetch(
          `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (itemsResponse.ok) {
          const items = await itemsResponse.json();
          setSettlementItems(items);
          
          // Update selected assignment totals
          const assignmentsResponse = await fetch(
            user?.role === 'Waff Clerk' 
              ? `${API_BASE}/api/petty-cash-assignments/my`
              : `${API_BASE}/api/petty-cash-assignments`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (assignmentsResponse.ok) {
            const allAssignments = await assignmentsResponse.json();
            const updated = allAssignments.find(a => a.assignmentId === selectedAssignment.assignmentId);
            if (updated) {
              setSelectedAssignment(updated);
            }
          }
        }
        
        cancelEditSettlementItem();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || 'Error updating settlement item'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error updating settlement item:', error);
      setMessage('❌ Error updating settlement item');
      setTimeout(() => setMessage(''), 3000);
    }
  };
  
  // Delete settlement item
  const deleteSettlementItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.itemName}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${item.settlementItemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        setMessage('✅ Settlement item deleted successfully');
        
        // Reload settlement items
        const itemsResponse = await fetch(
          `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (itemsResponse.ok) {
          const items = await itemsResponse.json();
          setSettlementItems(items);
          
          // Update selected assignment totals
          const assignmentsResponse = await fetch(
            user?.role === 'Waff Clerk' 
              ? `${API_BASE}/api/petty-cash-assignments/my`
              : `${API_BASE}/api/petty-cash-assignments`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (assignmentsResponse.ok) {
            const allAssignments = await assignmentsResponse.json();
            const updated = allAssignments.find(a => a.assignmentId === selectedAssignment.assignmentId);
            if (updated) {
              setSelectedAssignment(updated);
            }
          }
        }
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || 'Error deleting settlement item'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting settlement item:', error);
      setMessage('❌ Error deleting settlement item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const removeSettlementItem = (index) => {
    if (settlementItems.length > 1) {
      setSettlementItems(settlementItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotalSpent = () => {
    // Only count items that are NOT already paid (exclude read-only items from other clerks)
    return settlementItems.reduce((sum, item) => {
      if (item.alreadyPaid) {
        return sum; // Skip items already paid by this or other clerks
      }
      return sum + (parseFloat(item.actualCost) || 0);
    }, 0);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = settlementItems.filter(item => 
      item.itemName && item.actualCost && parseFloat(item.actualCost) > 0 && !item.alreadyPaid
    );
    
    if (validItems.length === 0) {
      setMessage('Please fill in at least one item with name and cost');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const itemsPayload = validItems.map(item => ({
      itemName: item.itemName,
      actualCost: parseFloat(item.actualCost),
      isCustomItem: item.isCustomItem,
      hasBill: item.hasBill ? true : false,
      paidBy: item.paidBy
    }));

    try {
      let url, body;

      if (selectedAssignment.isGroupedSettlement && selectedAssignment.groupAssignments?.length > 1) {
        // Use the group settle endpoint — settles ALL assignments in the group at once
        const groupId = selectedAssignment.groupAssignments[0].groupId
          || `${selectedAssignment.groupAssignments[0].jobId}_${selectedAssignment.groupAssignments[0].assignedTo}`;
        url = `${API_BASE}/api/petty-cash-assignments/group/${encodeURIComponent(groupId)}/settle`;
        body = JSON.stringify({ items: itemsPayload });
        console.log('GROUP SETTLE - URL:', url, 'groupId:', groupId);
      } else {
        // Single assignment settle
        url = `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settle`;
        body = JSON.stringify({ items: itemsPayload });
        console.log('SINGLE SETTLE - URL:', url);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body
      });

      console.log('Settle response status:', response.status);
      const responseData = await response.clone().json().catch(() => ({}));
      console.log('Settle response body:', responseData);

      if (response.ok) {
        setMessage('Petty cash settled successfully!');
        setShowSettleModal(false);
        setSelectedAssignment(null);
        setSettlementItems([]);
        fetchAssignments();
        fetchJobs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error settling petty cash');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error settling petty cash:', error);
      setMessage('Error settling petty cash');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Open settlement modal for balance return or overdue collection
  const openSettlementModal = (assignment, settlementType) => {
    setSelectedAssignment(assignment);
    const amount = settlementType === 'BALANCE_RETURN' ? assignment.balanceAmount : assignment.overAmount;
    setSettlementFormData({
      settlementType,
      amount: amount.toString(),
      notes: `${settlementType === 'BALANCE_RETURN' ? 'Balance return' : 'Overdue collection'} for Assignment #${assignment.assignmentId} (${assignment.jobId})`
    });
    setShowSettlementModal(true);
  };

  // Handle settlement form submission
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    
    if (!settlementFormData.settlementType || !settlementFormData.amount) {
      setMessage('Please fill in all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          settlementType: settlementFormData.settlementType,
          amount: parseFloat(settlementFormData.amount),
          notes: settlementFormData.notes,
          relatedAssignments: selectedAssignment.groupAssignmentIds || [selectedAssignment.assignmentId]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement request created successfully');
        setShowSettlementModal(false);
        setSettlementFormData({ settlementType: '', amount: '', notes: '' });
        setSelectedAssignment(null);
        // Refresh assignments to update UI
        fetchAssignments();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to create settlement request');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating settlement request:', error);
      setMessage('Error creating settlement request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Settled': return 'status-settled';
      case 'Settled/Approved': return 'status-approved';
      case 'Settled/Rejected': return 'status-rejected';
      case 'Returned': return 'status-returned';
      case 'Paid': return 'status-paid';
      case 'Pending Approval': return 'status-pending-approval';
      case 'Balance Returned': return 'status-balance-returned';
      case 'Overdue Collected': return 'status-overdue-collected';
      case 'Closed': return 'status-closed';
      default: return 'status-assigned';
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = async (assignmentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(assignmentId)) {
      newExpanded.delete(assignmentId);
    } else {
      newExpanded.add(assignmentId);
      
      // Load settlement items if not already loaded
      const assignment = assignments.find(a => a.assignmentId === assignmentId);
      if (assignment && (!assignment.settlementItems || assignment.settlementItems.length === 0)) {
        try {
          const response = await fetch(
            `${API_BASE}/api/petty-cash-assignments/${assignmentId}/settlement-items`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (response.ok) {
            const items = await response.json();
            // Update the assignment with settlement items
            setAssignments(assignments.map(a => 
              a.assignmentId === assignmentId ? { ...a, settlementItems: items } : a
            ));
          }
        } catch (error) {
          console.error('Error loading settlement items:', error);
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  // Inline edit handlers for settlement items in expanded rows
  const startInlineEdit = (assignmentId, item) => {
    setInlineEditingItem({ assignmentId, itemId: item.settlementItemId });
    setInlineEditName(item.itemName);
    setInlineEditCost(item.actualCost.toString());
  };

  const cancelInlineEdit = () => {
    setInlineEditingItem(null);
    setInlineEditName('');
    setInlineEditCost('');
  };

  const saveInlineEdit = async (assignmentId) => {
    const cost = parseFloat(inlineEditCost);
    if (!inlineEditName.trim() || isNaN(cost) || cost <= 0) {
      setMessage('❌ Please enter a valid item name and cost');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignmentId}/settlement-items/${inlineEditingItem.itemId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ itemName: inlineEditName.trim(), actualCost: cost })
        }
      );
      if (response.ok) {
        cancelInlineEdit();
        await reloadAssignmentItems(assignmentId);
        setMessage('✅ Item updated');
        setTimeout(() => setMessage(''), 2000);
      } else {
        const err = await response.json();
        setMessage(`❌ ${err.message || 'Error updating item'}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('❌ Error updating item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteInlineItem = async (assignmentId, item) => {
    if (!window.confirm(`Delete "${item.itemName}"?`)) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignmentId}/settlement-items/${item.settlementItemId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        await reloadAssignmentItems(assignmentId);
        setMessage('✅ Item deleted');
        setTimeout(() => setMessage(''), 2000);
      } else {
        const err = await response.json();
        setMessage(`❌ ${err.message || 'Error deleting item'}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('❌ Error deleting item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const saveInlineNewItem = async (assignmentId) => {
    const cost = parseFloat(inlineNewItem.actualCost);
    if (!inlineNewItem.itemName.trim() || isNaN(cost) || cost <= 0) {
      setMessage('❌ Please enter a valid item name and cost');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignmentId}/settle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({
            items: [{ itemName: inlineNewItem.itemName.trim(), actualCost: cost, isCustomItem: true, hasBill: inlineNewItem.hasBill }]
          })
        }
      );
      if (response.ok) {
        setInlineAddingRow(null);
        setInlineNewItem({ itemName: '', actualCost: '', hasBill: false });
        await reloadAssignmentItems(assignmentId);
        setMessage('✅ Item added');
        setTimeout(() => setMessage(''), 2000);
      } else {
        const err = await response.json();
        setMessage(`❌ ${err.message || 'Error adding item'}`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setMessage('❌ Error adding item');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const reloadAssignmentItems = async (assignmentId) => {
    const [itemsRes, assignmentsRes] = await Promise.all([
      fetch(`${API_BASE}/api/petty-cash-assignments/${assignmentId}/settlement-items`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }),
      fetch(`${API_BASE}/api/petty-cash-assignments${user?.role === 'Waff Clerk' ? '/my' : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
    ]);
    if (itemsRes.ok && assignmentsRes.ok) {
      const items = await itemsRes.json();
      const allAssignments = await assignmentsRes.json();
      setAssignments(allAssignments.map(a =>
        a.assignmentId === assignmentId ? { ...a, settlementItems: items } : a
      ));
    }
  };

  // Renders the expanded details row for a single assignment
  const renderExpandedDetails = (assignment) => (
    <tr className="expanded-details-row" key={`exp-${assignment.assignmentId}`}>
      <td colSpan="8">
        <div className="expanded-content">
          {/* Financial Summary Strip */}
          <div className="financial-summary-strip">
            <div className="fin-stat-item">
              <span className="fin-stat-label">Assigned Amount</span>
              <span className="fin-stat-value">LKR {formatAmount(assignment.assignedAmount)}</span>
            </div>
            <div className="fin-stat-divider" />
            <div className="fin-stat-item">
              <span className="fin-stat-label">Actual Spent</span>
              <span className="fin-stat-value">{assignment.actualSpent ? `LKR ${formatAmount(assignment.actualSpent)}` : '—'}</span>
            </div>
            {assignment.balanceAmount > 0 && !['Balance Returned', 'Settled/Approved', 'Closed'].includes(assignment.status) && (
              <>
                <div className="fin-stat-divider" />
                <div className="fin-stat-item">
                  <span className="fin-stat-label">Balance to Return</span>
                  <span className="fin-stat-value positive">LKR {formatAmount(assignment.balanceAmount)}</span>
                </div>
              </>
            )}
            {assignment.overAmount > 0 && !['Overdue Collected', 'Settled/Approved', 'Closed'].includes(assignment.status) && (
              <>
                <div className="fin-stat-divider" />
                <div className="fin-stat-item">
                  <span className="fin-stat-label">Over Amount</span>
                  <span className="fin-stat-value negative">LKR {formatAmount(assignment.overAmount)}</span>
                </div>
              </>
            )}
            {(assignment.status === 'Balance Returned' || assignment.status === 'Closed' || (assignment.status === 'Settled/Approved' && assignment.balanceAmount > 0)) && assignment.balanceAmount > 0 && (
              <>
                <div className="fin-stat-divider" />
                <div className="fin-stat-item">
                  <span className="fin-stat-label">Balance Returned</span>
                  <span className="fin-stat-value">LKR {formatAmount(assignment.balanceAmount)}</span>
                </div>
              </>
            )}
            {(assignment.status === 'Overdue Collected' || (assignment.status === 'Settled/Approved' && assignment.overAmount > 0)) && (
              <>
                <div className="fin-stat-divider" />
                <div className="fin-stat-item">
                  <span className="fin-stat-label">Overdue Collected</span>
                  <span className="fin-stat-value">LKR {formatAmount(assignment.overAmount)}</span>
                </div>
              </>
            )}
          </div>

          {/* Settlement Items Table */}
          {assignment.settlementItems && assignment.settlementItems.length > 0 && (
            <div className="settlement-items-section">
              <div className="settlement-items-header">
                <span className="settlement-items-title">Settlement Items</span>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <span className="settlement-items-count">{assignment.settlementItems.length} item{assignment.settlementItems.length !== 1 ? 's' : ''}</span>
                  {assignment.status === 'Settled' && user?.role === 'Waff Clerk' && !invoicedJobIds.has(assignment.jobId) && (
                    <button className="btn-add-inline-item" onClick={() => {
                      setInlineAddingRow(assignment.assignmentId);
                      setInlineNewItem({ itemName: '', actualCost: '', hasBill: false });
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add New Pay Item
                    </button>
                  )}
                </div>
              </div>
              <div className="settlement-review-table">
                {(() => {
                  const canEditItems = assignment.status === 'Settled' && user?.role === 'Waff Clerk' && !invoicedJobIds.has(assignment.jobId);
                  return (
                    <>
                      <div className={`settlement-table-header ${canEditItems ? 'with-actions' : ''}`}>
                        <div className="settlement-header-cell settlement-num-col">#</div>
                        <div className="settlement-header-cell settlement-name-col">Item Name</div>
                        <div className="settlement-header-cell settlement-type-col">Type</div>
                        <div className="settlement-header-cell settlement-bill-col">Bill</div>
                        <div className="settlement-header-cell settlement-amount-col">Actual Cost</div>
                        {canEditItems && <div className="settlement-header-cell settlement-actions-col">Actions</div>}
                      </div>
                      <div className="settlement-table-body">
                        {assignment.settlementItems.map((item, idx) => {
                          const isEditing = inlineEditingItem?.assignmentId === assignment.assignmentId && inlineEditingItem?.itemId === item.settlementItemId;
                          return (
                            <div key={idx} className={`settlement-table-row ${isEditing ? 'editing-row' : ''} ${canEditItems ? 'with-actions' : ''}`}>
                              <div className="settlement-table-cell settlement-num-col settlement-num">{idx + 1}</div>
                              <div className="settlement-table-cell settlement-name-col">
                                {isEditing ? <input className="inline-edit-field" value={inlineEditName} onChange={e => setInlineEditName(e.target.value)} autoFocus /> : item.itemName}
                              </div>
                              <div className="settlement-table-cell settlement-type-col">
                                <span className={`type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>{item.isCustomItem ? 'Custom' : 'Template'}</span>
                              </div>
                              <div className="settlement-table-cell settlement-bill-col">
                                {item.hasBill ? (
                                  <span className="bill-badge-small has-bill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Bill</span>
                                ) : (
                                  <span className="bill-badge-small no-bill">No Bill</span>
                                )}
                              </div>
                              <div className="settlement-table-cell settlement-amount-col settlement-amount-value">
                                {isEditing ? (
                                  <input className="inline-edit-field inline-edit-amount" type="number" step="0.01" value={inlineEditCost} onChange={e => setInlineEditCost(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(assignment.assignmentId); if (e.key === 'Escape') cancelInlineEdit(); }} />
                                ) : `LKR ${formatAmount(item.actualCost)}`}
                              </div>
                              {canEditItems && (
                                <div className="settlement-table-cell settlement-actions-col">
                                  {isEditing ? (
                                    <div className="inline-action-btns">
                                      <button className="inline-btn-save" onClick={() => saveInlineEdit(assignment.assignmentId)} title="Save"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
                                      <button className="inline-btn-cancel" onClick={cancelInlineEdit} title="Cancel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </div>
                                  ) : (
                                    <div className="inline-action-btns">
                                      <button className="inline-btn-edit" onClick={async () => {
                                        const inv = await checkInvoiceGenerated(assignment.jobId);
                                        if (inv) { setMessage('❌ Invoice already generated'); setTimeout(() => setMessage(''), 3000); return; }
                                        startInlineEdit(assignment.assignmentId, item);
                                      }} title="Edit item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                      <button className="inline-btn-delete" onClick={() => deleteInlineItem(assignment.assignmentId, item)} title="Delete item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {inlineAddingRow === assignment.assignmentId && (
                          <div className="settlement-table-row new-item-row with-actions">
                            <div className="settlement-table-cell settlement-num-col settlement-num"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
                            <div className="settlement-table-cell settlement-name-col"><input className="inline-edit-field" placeholder="Item name" value={inlineNewItem.itemName} onChange={e => setInlineNewItem({...inlineNewItem, itemName: e.target.value})} autoFocus /></div>
                            <div className="settlement-table-cell settlement-type-col"><span className="type-badge custom">Custom</span></div>
                            <div className="settlement-table-cell settlement-bill-col"><label className="inline-bill-check"><input type="checkbox" checked={inlineNewItem.hasBill} onChange={e => setInlineNewItem({...inlineNewItem, hasBill: e.target.checked})} />Bill</label></div>
                            <div className="settlement-table-cell settlement-amount-col"><input className="inline-edit-field inline-edit-amount" type="number" step="0.01" placeholder="0.00" value={inlineNewItem.actualCost} onChange={e => setInlineNewItem({...inlineNewItem, actualCost: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') saveInlineNewItem(assignment.assignmentId); if (e.key === 'Escape') { setInlineAddingRow(null); setInlineNewItem({ itemName: '', actualCost: '', hasBill: false }); } }} /></div>
                            <div className="settlement-table-cell settlement-actions-col">
                              <div className="inline-action-btns">
                                <button className="inline-btn-save" onClick={() => saveInlineNewItem(assignment.assignmentId)} title="Save new item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
                                <button className="inline-btn-cancel" onClick={() => { setInlineAddingRow(null); setInlineNewItem({ itemName: '', actualCost: '', hasBill: false }); }} title="Cancel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={`settlement-table-row settlement-total-row ${assignment.status === 'Settled' && user?.role === 'Waff Clerk' && !invoicedJobIds.has(assignment.jobId) ? 'with-actions' : ''}`}>
                          <div className="settlement-table-cell settlement-num-col"></div>
                          <div className="settlement-table-cell settlement-name-col"><strong>Total</strong></div>
                          <div className="settlement-table-cell settlement-type-col"></div>
                          <div className="settlement-table-cell settlement-bill-col"></div>
                          <div className="settlement-table-cell settlement-amount-col settlement-amount-value">
                            <strong>LKR {formatAmount(assignment.settlementItems.reduce((sum, i) => sum + parseFloat(i.actualCost || 0), 0))}</strong>
                          </div>
                          {assignment.status === 'Settled' && user?.role === 'Waff Clerk' && !invoicedJobIds.has(assignment.jobId) && <div className="settlement-table-cell settlement-actions-col"></div>}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {(!assignment.settlementItems || assignment.settlementItems.length === 0) && (
            <div className="no-settlement-items">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No settlement items recorded</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="petty-cash-page">
      <div className="page-header">
        <div>
          <h1>Petty Cash Management</h1>
          <p>{user?.role === 'Waff Clerk' ? 'Your assigned petty cash' : 'Manage petty cash assignments'}</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
          <button onClick={() => setShowAssignModal(true)} className="btn btn-primary">
            + Assign Petty Cash
          </button>
        )}
      </div>

      {/* Overall Balance Card for Admin/Super Admin */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
        <div className="balance-cards">
          <div className="balance-card overall-balance">
            <div className="balance-card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div className="balance-card-content">
              <h3>Overall Petty Cash Balance</h3>
              <p className="balance-amount">LKR {formatAmount(overallBalance)}</p>
              <p className="balance-description">Total available petty cash in system</p>
            </div>
          </div>
        </div>
      )}

      {/* User Balances Summary for Admin/Super Admin */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && Object.keys(userBalances).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>User Petty Cash Summary</h2>
          </div>
          <div className="user-balances-grid">
            {Object.entries(userBalances).map(([userId, balance]) => {
              return (
                <div key={userId} className="user-balance-card">
                  <div className="user-balance-header">
                    <div className="user-avatar">
                      {balance.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4>{balance.userName}</h4>
                      <p className="user-id">{userId}</p>
                    </div>
                  </div>
                  <div className="user-balance-stats">
                    <div className="stat-row">
                      <span className="stat-label">Total Assigned:</span>
                      <span className="stat-value">LKR {formatAmount(balance.totalAssigned)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Spent:</span>
                      <span className="stat-value">LKR {formatAmount(balance.totalSpent)}</span>
                    </div>
                    {balance.totalBalance > 0 && (
                      <div className="stat-row">
                        <span className="stat-label">Balance to Return:</span>
                        <span className="stat-value balance-positive">LKR {formatAmount(balance.totalBalance)}</span>
                      </div>
                    )}
                    {balance.totalOver > 0 && (
                      <div className="stat-row">
                        <span className="stat-label">Over Amount:</span>
                        <span className="stat-value balance-negative">LKR {formatAmount(balance.totalOver)}</span>
                      </div>
                    )}
                    <div className="stat-row stat-row-divider">
                      <span className="stat-label">Active Assignments:</span>
                      <span className="stat-value stat-badge">{balance.activeAssignments}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Settled Assignments:</span>
                      <span className="stat-value stat-badge">{balance.settledAssignments}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User's Own Balance Summary */}
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Management Settlement Section */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
        <ManagementSettlementSection user={user} />
      )}

      <div className="card">
        <div className="card-header">
          <h2>Petty Cash Assignments ({assignments.length})</h2>
        </div>
        
        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <p>{user?.role === 'Waff Clerk' ? 'No petty cash assigned to you yet' : 'No petty cash assignments yet'}</p>
          </div>
        ) : (
          <div className="assignments-table-wrapper">
            <table className="assignments-table-modern">
              <thead>
                <tr>
                  <th style={{width: '50px'}}></th>
                  <th>Assignment ID</th>
                  <th>Job ID / CUSDEC Number</th>
                  <th style={{minWidth: '220px'}}>Customer</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Total Assigned</th>
                  <th>Assigned Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group assignments by groupId
                  console.log('=== GROUPING DEBUG ===');
                  console.log('Total assignments:', assignments.length);
                  console.log('Assignments data:', assignments);
                  
                  const groupMap = new Map();
                  assignments.forEach(a => {
                    const gid = a.groupId || `${a.jobId}_${a.assignedTo}`;
                    console.log(`Assignment ${a.assignmentId}: jobId=${a.jobId}, assignedTo=${a.assignedTo}, groupId=${a.groupId}, calculated=${gid}`);
                    if (!groupMap.has(gid)) groupMap.set(gid, []);
                    groupMap.get(gid).push(a);
                  });
                  const groups = Array.from(groupMap.entries());
                  
                  console.log('Total groups:', groups.length);
                  console.log('Groups:', groups.map(([gid, assigns]) => ({ groupId: gid, count: assigns.length, ids: assigns.map(a => a.assignmentId) })));
                  console.log('=== END DEBUG ===');

                  return groups.map(([groupId, groupAssignments]) => {
                    const first = groupAssignments[0];
                    const job = jobs.find(j => j.jobId === first.jobId);
                    const isGroupExpanded = expandedRows.has(groupId);
                    const isMulti = groupAssignments.length > 1;

                    // Group-level aggregates
                    const totalAssigned = groupAssignments.reduce((s, a) => s + parseFloat(a.assignedAmount || 0), 0);
                    const totalSpent = groupAssignments.reduce((s, a) => s + parseFloat(a.actualSpent || 0), 0);
                    const totalBalance = totalAssigned > totalSpent ? totalAssigned - totalSpent : 0;
                    const totalOver = totalSpent > totalAssigned ? totalSpent - totalAssigned : 0;
                    const allSettled = groupAssignments.every(a => ['Settled','Settled/Approved','Settled/Rejected','Balance Returned','Overdue Collected','Closed'].includes(a.status));
                    const anyAssigned = groupAssignments.some(a => a.status === 'Assigned');
                    // Status priority: most advanced status wins for the group display
                    const statusPriority = ['Assigned','Settled','Settled/Rejected','Pending Approval','Balance Returned','Overdue Collected','Settled/Approved','Closed'];
                    const groupStatus = isMulti
                      ? (() => {
                          if (anyAssigned) return 'Assigned';
                          // Pick the highest-priority status among all assignments
                          let best = groupAssignments[0].status;
                          for (const a of groupAssignments) {
                            const ai = statusPriority.indexOf(a.status);
                            const bi = statusPriority.indexOf(best);
                            if (ai > bi) best = a.status;
                          }
                          return best;
                        })()
                      : groupAssignments[0].status;
                    // Collect all settlement items across all assignments in the group
                    const allSettlementItems = groupAssignments.flatMap(a => a.settlementItems || []);
                    // Balance/Over buttons: only show for Settled or Settled/Rejected (not after Balance Returned/Approved)
                    const canReturnBalance = !anyAssigned && user?.role === 'Waff Clerk'
                      && (groupStatus === 'Settled' || groupStatus === 'Settled/Rejected')
                      && (isMulti ? totalBalance > 0 : first.balanceAmount > 0);
                    const canCollectOverdue = !anyAssigned && user?.role === 'Waff Clerk'
                      && (groupStatus === 'Settled' || groupStatus === 'Settled/Rejected')
                      && (isMulti ? totalOver > 0 : first.overAmount > 0);

                    return (
                      <React.Fragment key={groupId}>
                        {/* Group Header Row */}
                        <tr className={`assignment-row ${isGroupExpanded ? 'expanded' : ''} ${isMulti ? 'group-row' : ''}`}>
                          <td>
                            <button
                              className="expand-btn"
                              onClick={() => {
                                const newExpanded = new Set(expandedRows);
                                if (newExpanded.has(groupId)) newExpanded.delete(groupId);
                                else newExpanded.add(groupId);
                                setExpandedRows(newExpanded);
                              }}
                              aria-label={isGroupExpanded ? 'Collapse' : 'Expand'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`expand-icon ${isGroupExpanded ? 'rotated' : ''}`}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </td>
                          <td>
                            {isMulti ? (
                              <strong className="assignment-id">#{first.assignmentId}</strong>
                            ) : (
                              <strong className="assignment-id">#{first.assignmentId}</strong>
                            )}
                          </td>
                          <td className="job-cusdec-cell">
                            {job && job.cusdecNumber ? (
                              <span>{first.jobId} / {job.cusdecNumber}</span>
                            ) : (
                              <span>{first.jobId}</span>
                            )}
                          </td>
                          <td className="customer-name-cell">{job ? getCustomerName(job.customerId) : '-'}</td>
                          <td className="assigned-to-cell">
                            <span className="assigned-to-name">{first.assignedToName || first.assignedTo || '-'}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(groupStatus)}`}>
                              {groupStatus}
                            </span>
                          </td>
                          <td><strong>LKR {formatAmount(totalAssigned)}</strong></td>
                          <td>{new Date(first.assignedDate).toLocaleDateString()}</td>
                          <td>
                            <div className="actions-cell-hybrid">
                              {/* Unified action logic for both single and grouped assignments */}
                              {anyAssigned && user?.role === 'Waff Clerk' && (
                                <button className="btn-settle-primary" onClick={() => {
                                  const settlementAssignment = {
                                    ...first,
                                    assignedAmount: totalAssigned,
                                    isGroupedSettlement: isMulti,
                                    groupAssignments: groupAssignments
                                  };
                                  openSettleModal(settlementAssignment);
                                }} title="Settle petty cash">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                  Settle
                                </button>
                              )}
                              {!anyAssigned && user?.role === 'Waff Clerk' && groupStatus === 'Pending Approval' && (
                                <span className="pending-approval-badge">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  Pending Approval
                                </span>
                              )}
                              {canReturnBalance && (
                                <button className="btn-modern btn-success" onClick={() => {
                                  const assignmentForModal = isMulti
                                    ? { ...first, balanceAmount: totalBalance, overAmount: totalOver, groupAssignmentIds: groupAssignments.map(a => a.assignmentId) }
                                    : first;
                                  openSettlementModal(assignmentForModal, 'BALANCE_RETURN');
                                }}>Return Balance</button>
                              )}
                              {canCollectOverdue && (
                                <button className="btn-modern btn-warning" onClick={() => {
                                  const assignmentForModal = isMulti
                                    ? { ...first, balanceAmount: totalBalance, overAmount: totalOver, groupAssignmentIds: groupAssignments.map(a => a.assignmentId) }
                                    : first;
                                  openSettlementModal(assignmentForModal, 'OVERDUE_COLLECTION');
                                }}>Collect Overdue</button>
                              )}
                              {!anyAssigned && (
                                <button className="btn-view-eye" onClick={() => {
                                  const newExpanded = new Set(expandedRows);
                                  if (newExpanded.has(groupId)) newExpanded.delete(groupId);
                                  else newExpanded.add(groupId);
                                  setExpandedRows(newExpanded);
                                }} title={isGroupExpanded ? 'Hide Details' : 'View Details'}>
                                  {isGroupExpanded ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded: for multi-assignment groups, show sub-assignments in a professional table */}
                        {isGroupExpanded && isMulti && (
                          <tr className="sub-assignments-container-row">
                            <td colSpan="8" style={{padding: 0, backgroundColor: '#f8f9fa'}}>
                              <div className="sub-assignments-wrapper">

                                {/* Sub-Assignments simple table: ID, Amount, Date only */}
                                <div className="sub-assignments-header">
                                  <h4>Sub-Assignments</h4>
                                  <span className="sub-count">{groupAssignments.length} assignments</span>
                                </div>
                                <table className="sub-assignments-table">
                                  <thead>
                                    <tr>
                                      <th style={{width: '30%'}}>Assignment ID</th>
                                      <th style={{width: '35%'}}>Assigned Amount</th>
                                      <th style={{width: '35%'}}>Assigned Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupAssignments.map((assignment, index) => {
                                      const subAssignmentId = `#${first.assignmentId}-${index + 1}`;
                                      return (
                                        <tr key={assignment.assignmentId} className="sub-assignment-row">
                                          <td><strong className="sub-assignment-id">{subAssignmentId}</strong></td>
                                          <td className="amount-cell"><strong>LKR {formatAmount(assignment.assignedAmount)}</strong></td>
                                          <td className="date-cell">{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                                        </tr>
                                      );
                                    })}
                                    {/* Totals Row */}
                                    <tr className="sub-totals-row">
                                      <td><strong>TOTAL</strong></td>
                                      <td className="amount-cell"><strong>LKR {formatAmount(totalAssigned)}</strong></td>
                                      <td></td>
                                    </tr>
                                  </tbody>
                                </table>

                                {/* Group Financial Summary — shown after settling */}
                                {allSettled && (
                                  <div style={{marginTop: '1.5rem'}}>
                                    <div className="financial-summary-strip">
                                      <div className="fin-stat-item">
                                        <span className="fin-stat-label">Total Assigned</span>
                                        <span className="fin-stat-value">LKR {formatAmount(totalAssigned)}</span>
                                      </div>
                                      <div className="fin-stat-divider" />
                                      <div className="fin-stat-item">
                                        <span className="fin-stat-label">Total Spent</span>
                                        <span className="fin-stat-value">{totalSpent > 0 ? `LKR ${formatAmount(totalSpent)}` : '—'}</span>
                                      </div>
                                      {/* Balance to Return — only before approval/close */}
                                      {totalBalance > 0 && !['Balance Returned', 'Settled/Approved', 'Closed'].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Balance to Return</span>
                                            <span className="fin-stat-value positive">LKR {formatAmount(totalBalance)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Balance Returned — after approval or close */}
                                      {totalBalance > 0 && ['Balance Returned', 'Settled/Approved', 'Closed'].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Balance Returned</span>
                                            <span className="fin-stat-value">LKR {formatAmount(totalBalance)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Over Amount — only before collection/close */}
                                      {totalOver > 0 && !['Overdue Collected', 'Settled/Approved', 'Closed'].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Over Amount</span>
                                            <span className="fin-stat-value negative">LKR {formatAmount(totalOver)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Overdue Collected — after collection or close */}
                                      {totalOver > 0 && ['Overdue Collected', 'Settled/Approved', 'Closed'].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Overdue Collected</span>
                                            <span className="fin-stat-value">LKR {formatAmount(totalOver)}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Settlement Items across all assignments */}
                                    {allSettlementItems.length > 0 && (
                                      <div className="settlement-items-section" style={{marginTop: '1rem'}}>
                                        <div className="settlement-items-header">
                                          <span className="settlement-items-title">Settlement Items</span>
                                          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                            <span className="settlement-items-count">{allSettlementItems.length} item{allSettlementItems.length !== 1 ? 's' : ''}</span>
                                            {user?.role === 'Waff Clerk' && !invoicedJobIds.has(first.jobId) && (
                                              <button className="btn-add-inline-item" onClick={() => {
                                                setInlineAddingRow(first.assignmentId);
                                                setInlineNewItem({ itemName: '', actualCost: '', hasBill: false });
                                              }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                Add New Pay Item
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="settlement-review-table">
                                          {(() => {
                                            const canEdit = user?.role === 'Waff Clerk' && !invoicedJobIds.has(first.jobId);
                                            return (
                                              <>
                                                <div className={`settlement-table-header ${canEdit ? 'with-actions' : ''}`}>
                                                  <div className="settlement-header-cell settlement-num-col">#</div>
                                                  <div className="settlement-header-cell settlement-name-col">Item Name</div>
                                                  <div className="settlement-header-cell settlement-type-col">Type</div>
                                                  <div className="settlement-header-cell settlement-bill-col">Bill</div>
                                                  <div className="settlement-header-cell settlement-amount-col">Actual Cost</div>
                                                  {canEdit && <div className="settlement-header-cell settlement-actions-col">Actions</div>}
                                                </div>
                                                <div className="settlement-table-body">
                                                  {allSettlementItems.map((item, idx) => {
                                                    const isEditing = inlineEditingItem?.assignmentId === item.assignmentId && inlineEditingItem?.itemId === item.settlementItemId;
                                                    return (
                                                      <div key={idx} className={`settlement-table-row ${isEditing ? 'editing-row' : ''} ${canEdit ? 'with-actions' : ''}`}>
                                                        <div className="settlement-table-cell settlement-num-col settlement-num">{idx + 1}</div>
                                                        <div className="settlement-table-cell settlement-name-col">
                                                          {isEditing ? <input className="inline-edit-field" value={inlineEditName} onChange={e => setInlineEditName(e.target.value)} autoFocus /> : item.itemName}
                                                        </div>
                                                        <div className="settlement-table-cell settlement-type-col">
                                                          <span className={`type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>{item.isCustomItem ? 'Custom' : 'Template'}</span>
                                                        </div>
                                                        <div className="settlement-table-cell settlement-bill-col">
                                                          {item.hasBill
                                                            ? <span className="bill-badge-small has-bill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Bill</span>
                                                            : <span className="bill-badge-small no-bill">No Bill</span>}
                                                        </div>
                                                        <div className="settlement-table-cell settlement-amount-col settlement-amount-value">
                                                          {isEditing
                                                            ? <input className="inline-edit-field inline-edit-amount" type="number" step="0.01" value={inlineEditCost} onChange={e => setInlineEditCost(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(item.assignmentId); if (e.key === 'Escape') cancelInlineEdit(); }} />
                                                            : `LKR ${formatAmount(item.actualCost)}`}
                                                        </div>
                                                        {canEdit && (
                                                          <div className="settlement-table-cell settlement-actions-col">
                                                            {isEditing ? (
                                                              <div className="inline-action-btns">
                                                                <button className="inline-btn-save" onClick={() => saveInlineEdit(item.assignmentId)} title="Save"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
                                                                <button className="inline-btn-cancel" onClick={cancelInlineEdit} title="Cancel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                                              </div>
                                                            ) : (
                                                              <div className="inline-action-btns">
                                                                <button className="inline-btn-edit" onClick={async () => {
                                                                  const inv = await checkInvoiceGenerated(first.jobId);
                                                                  if (inv) { setMessage('❌ Invoice already generated'); setTimeout(() => setMessage(''), 3000); return; }
                                                                  startInlineEdit(item.assignmentId, item);
                                                                }} title="Edit item">
                                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                                </button>
                                                                {item.isCustomItem && (
                                                                  <button className="inline-btn-delete" onClick={() => deleteInlineItem(item.assignmentId, item)} title="Delete item">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                                  </button>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                  {/* Inline add new item row */}
                                                  {inlineAddingRow === first.assignmentId && (
                                                    <div className="settlement-table-row new-item-row with-actions">
                                                      <div className="settlement-table-cell settlement-num-col settlement-num"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
                                                      <div className="settlement-table-cell settlement-name-col"><input className="inline-edit-field" placeholder="Item name" value={inlineNewItem.itemName} onChange={e => setInlineNewItem({...inlineNewItem, itemName: e.target.value})} autoFocus /></div>
                                                      <div className="settlement-table-cell settlement-type-col"><span className="type-badge custom">Custom</span></div>
                                                      <div className="settlement-table-cell settlement-bill-col"><label className="inline-bill-check"><input type="checkbox" checked={inlineNewItem.hasBill} onChange={e => setInlineNewItem({...inlineNewItem, hasBill: e.target.checked})} />Bill</label></div>
                                                      <div className="settlement-table-cell settlement-amount-col"><input className="inline-edit-field inline-edit-amount" type="number" step="0.01" placeholder="0.00" value={inlineNewItem.actualCost} onChange={e => setInlineNewItem({...inlineNewItem, actualCost: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') saveInlineNewItem(first.assignmentId); if (e.key === 'Escape') { setInlineAddingRow(null); setInlineNewItem({ itemName: '', actualCost: '', hasBill: false }); } }} /></div>
                                                      <div className="settlement-table-cell settlement-actions-col">
                                                        <div className="inline-action-btns">
                                                          <button className="inline-btn-save" onClick={() => saveInlineNewItem(first.assignmentId)} title="Save"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
                                                          <button className="inline-btn-cancel" onClick={() => { setInlineAddingRow(null); setInlineNewItem({ itemName: '', actualCost: '', hasBill: false }); }} title="Cancel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                  {/* Total row */}
                                                  <div className={`settlement-table-row settlement-total-row ${canEdit ? 'with-actions' : ''}`}>
                                                    <div className="settlement-table-cell settlement-num-col"></div>
                                                    <div className="settlement-table-cell settlement-name-col"><strong>Total</strong></div>
                                                    <div className="settlement-table-cell settlement-type-col"></div>
                                                    <div className="settlement-table-cell settlement-bill-col"></div>
                                                    <div className="settlement-table-cell settlement-amount-col settlement-amount-value">
                                                      <strong>LKR {formatAmount(allSettlementItems.reduce((sum, i) => sum + parseFloat(i.actualCost || 0), 0))}</strong>
                                                    </div>
                                                    {canEdit && <div className="settlement-table-cell settlement-actions-col"></div>}
                                                  </div>
                                                </div>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Single assignment expanded details */}
                        {isGroupExpanded && !isMulti && renderExpandedDetails(first)}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Assign Petty Cash Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Petty Cash</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="petty-cash-form">
              <div className="form-group">
                <label>Select Job <span className="required">*</span></label>
                <select
                  value={assignFormData.jobId}
                  onChange={(e) => setAssignFormData({ 
                    ...assignFormData, 
                    jobId: e.target.value,
                    assignedTo: '' // Reset user selection when job changes
                  })}
                  required
                >
                  <option value="">-- Select Job --</option>
                  {getAvailableJobs().map(job => (
                    <option key={job.jobId} value={job.jobId}>
                      {job.jobId} - {getCustomerName(job.customerId)} - {job.shipmentCategory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign To <span className="required">*</span></label>
                <select
                  value={assignFormData.assignedTo}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedTo: e.target.value })}
                  required
                >
                  <option value="">-- Select User --</option>
                  {getAvailableUsersForJob(assignFormData.jobId).map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
                {assignFormData.jobId && getAvailableUsersForJob(assignFormData.jobId).length === 0 && (
                  <p className="helper-text warning">No users are assigned to this job.</p>
                )}
              </div>

              <div className="form-group">
                <label>Amount (LKR) <span className="required">*</span></label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={assignFormData.assignedAmount}
                  onChange={handleAssignedAmountChange}
                  onKeyDown={handleAssignedAmountKeyDown}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (!/^\d+(\.\d{1,2})?$/.test(pastedText.trim())) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Assign Petty Cash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => {
          if (selectedAssignment.status !== 'Settled') {
            setShowSettleModal(false);
            setSelectedAssignment(null);
            setSettlementItems([]);
          }
        }}>
          <div className="modal modal-large modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Settled/Approved' || selectedAssignment.status === 'Settled/Rejected' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') ? 'Settlement Details' : 'Settle Petty Cash'}</h2>
              <button className="btn-close" onClick={() => {
                setShowSettleModal(false);
                setSelectedAssignment(null);
                setSettlementItems([]);
              }}>×</button>
            </div>

            <div className="modal-body-scrollable">

            <div className="settlement-info">
              <div className="settlement-info-grid">
                <div className="settlement-info-item">
                  <span className="info-label">Job ID:</span>
                  <span className="info-value">{selectedAssignment.jobId}</span>
                </div>
                <div className="settlement-info-item">
                  <span className="info-label">Assigned Amount:</span>
                  <span className="info-value">LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                </div>
                {(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') && (
                  <div className="settlement-info-item">
                    <span className="info-label">Actual Spent:</span>
                    <span className="info-value">LKR {formatAmount(selectedAssignment.actualSpent)}</span>
                  </div>
                )}
                {selectedAssignment.balanceAmount > 0 && (
                  <div className="settlement-info-item">
                    <span className="info-label">Balance to Return:</span>
                    <span className="info-value balance-positive">LKR {formatAmount(selectedAssignment.balanceAmount)}</span>
                  </div>
                )}
                {selectedAssignment.overAmount > 0 && (
                  <div className="settlement-info-item">
                    <span className="info-label">Over Amount:</span>
                    <span className="info-value balance-negative">LKR {formatAmount(selectedAssignment.overAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Settled/Approved' || selectedAssignment.status === 'Settled/Rejected' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') ? (
              <div className="settlement-items-view">
                <h3>Settlement Items {!canEditSettlement && '(Read-Only)'}</h3>
                {canEditSettlement && (
                  <p className="edit-notice">✏️ You can edit or delete items below (invoice not yet generated)</p>
                )}
                <table className="settlement-items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Actual Cost (LKR)</th>
                      <th>Type</th>
                      <th>Bill</th>
                      <th>Paid By</th>
                      {canEditSettlement && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {settlementItems.map((item, index) => (
                      <tr key={index} className={item.hasBill ? 'has-bill-row-view' : ''}>
                        {editingSettlementItem === item.settlementItemId ? (
                          <>
                            <td>
                              <input
                                type="text"
                                value={editItemName}
                                onChange={(e) => setEditItemName(e.target.value)}
                                className="edit-input"
                                placeholder="Item name"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={editActualCost}
                                onChange={(e) => setEditActualCost(e.target.value)}
                                className="edit-input"
                                placeholder="0.00"
                              />
                            </td>
                            <td>
                              <span className={`item-type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>
                                {item.isCustomItem ? 'Custom' : 'Template'}
                              </span>
                            </td>
                            <td className="bill-cell">
                              {item.hasBill ? (
                                <span className="bill-badge">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                  </svg>
                                  Bill
                                </span>
                              ) : (
                                <span className="no-bill-badge">No Bill</span>
                              )}
                            </td>
                            <td>
                              <span className="paid-by-badge">
                                {item.paidByName || 'Unknown'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button onClick={saveEditedSettlementItem} className="btn-save-edit" title="Save changes">
                                ✓
                              </button>
                              <button onClick={cancelEditSettlementItem} className="btn-cancel-edit" title="Cancel">
                                ✗
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.itemName}</td>
                            <td className="amount">LKR {formatAmount(item.actualCost)}</td>
                            <td>
                              <span className={`item-type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>
                                {item.isCustomItem ? 'Custom' : 'Template'}
                              </span>
                            </td>
                            <td className="bill-cell">
                              {item.hasBill ? (
                                <span className="bill-badge">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                  </svg>
                                  Bill
                                </span>
                              ) : (
                                <span className="no-bill-badge">No Bill</span>
                              )}
                            </td>
                            <td>
                              <span className="paid-by-badge">
                                {item.paidByName || 'Unknown'}
                              </span>
                            </td>
                            {canEditSettlement && (
                              <td className="actions-cell">
                                <button onClick={() => startEditSettlementItem(item)} className="btn-edit-item" title="Edit item">
                                  ✏️
                                </button>
                                <button onClick={() => deleteSettlementItem(item)} className="btn-delete-item" title="Delete item">
                                  🗑️
                                </button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td className="amount"><strong>LKR {formatAmount(selectedAssignment.actualSpent)}</strong></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      {canEditSettlement && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <form onSubmit={handleSettleSubmit} className="settlement-form">
                <h3>Settlement Items</h3>
                <p className="helper-text info">Fill in only the items you paid for. Tick the "Bill" checkbox if you have a proof receipt for that item. Items already paid in other assignments are shown as read-only.</p>
                <div className="settlement-items-list">
                  {settlementItems.map((item, index) => (
                    <div key={index} className={`settlement-item-row ${item.alreadyPaid ? 'paid-item-row' : ''} ${item.hasBill ? 'has-bill-row' : ''}`}>
                      <div className="item-number">{index + 1}</div>
                      <div className="form-group">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleSettlementItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          disabled={item.alreadyPaid}
                          className={item.alreadyPaid ? 'paid-input' : ''}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          step="0.01"
                          value={item.actualCost}
                          onChange={(e) => handleSettlementItemChange(index, 'actualCost', e.target.value)}
                          placeholder={item.alreadyPaid ? `Paid: ${item.actualCost}` : '0.00'}
                          disabled={item.alreadyPaid}
                          className={item.alreadyPaid ? 'paid-input' : ''}
                        />
                      </div>
                      {/* Has Bill Checkbox */}
                      {!item.alreadyPaid && (
                        <div className="has-bill-check">
                          <input
                            type="checkbox"
                            id={`hasBill-${index}`}
                            checked={!!item.hasBill}
                            onChange={(e) => handleSettlementItemChange(index, 'hasBill', e.target.checked)}
                            title="Check if you have a proof bill/receipt for this item"
                          />
                          <label htmlFor={`hasBill-${index}`} title="Has proof bill/receipt">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Bill
                          </label>
                        </div>
                      )}
                      {item.alreadyPaid && item.hasBill && (
                        <div className="bill-indicator" title="This item has a proof bill">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          Bill
                        </div>
                      )}
                      {item.alreadyPaid && (
                        <div className="paid-by-indicator">
                          <span className="paid-by-badge">
                            {item.assignmentId ? `Paid in Assignment #${item.assignmentId}` : 'Paid'}
                            {item.paidByName ? ` by ${item.paidByName}` : ''}
                          </span>
                        </div>
                      )}
                      {!item.alreadyPaid && settlementItems.filter(i => !i.alreadyPaid).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSettlementItem(index)}
                          className="btn-remove-item"
                          title="Remove item"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addSettlementItem} className="btn btn-secondary btn-add-item">
                  + Add Custom Item
                </button>

                <div className="settlement-summary">
                  <div className="summary-row">
                    <span>Assigned Amount:</span>
                    <span>LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Spent:</span>
                    <span>LKR {formatAmount(calculateTotalSpent())}</span>
                  </div>
                  <div className="summary-row total">
                    {calculateTotalSpent() < selectedAssignment.assignedAmount ? (
                      <>
                        <span>Balance to Return:</span>
                        <span className="balance-positive">
                          LKR {formatAmount(selectedAssignment.assignedAmount - calculateTotalSpent())}
                        </span>
                      </>
                    ) : calculateTotalSpent() > selectedAssignment.assignedAmount ? (
                      <>
                        <span>Over Amount:</span>
                        <span className="balance-negative">
                          LKR {formatAmount(calculateTotalSpent() - selectedAssignment.assignedAmount)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Exact Match:</span>
                        <span>LKR 0.00</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettleModal(false);
                      setSelectedAssignment(null);
                      setSettlementItems([]);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">Settle Petty Cash</button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Cash Balance Settlement Modal */}
      {showSettlementModal && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-content settlement-modal">
            <div className="modal-header">
              <h3>
                {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Return Balance Cash' : 'Collect Overdue Cash'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowSettlementModal(false);
                  setSelectedAssignment(null);
                  setSettlementFormData({ settlementType: '', amount: '', notes: '' });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assignment-info">
                <div className="info-row">
                  <span className="info-label">Assignment:</span>
                  <span className="info-value">#{selectedAssignment.assignmentId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Job ID:</span>
                  <span className="info-value">{selectedAssignment.jobId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Balance Amount:' : 'Overdue Amount:'}
                  </span>
                  <span className={`info-value ${settlementFormData.settlementType === 'BALANCE_RETURN' ? 'balance-positive' : 'balance-negative'}`}>
                    LKR {formatAmount(settlementFormData.amount)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSettlementSubmit} className="settlement-form">
                <div className="form-group">
                  <label>Settlement Type</label>
                  <input
                    type="text"
                    value={settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Return Balance to Management' : 'Collect Overdue from Management'}
                    disabled
                    className="form-control disabled"
                  />
                </div>

                <div className="form-group">
                  <label>Amount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settlementFormData.amount}
                    onChange={(e) => setSettlementFormData({...settlementFormData, amount: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={settlementFormData.notes}
                    onChange={(e) => setSettlementFormData({...settlementFormData, notes: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="Add any additional notes or details"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettlementModal(false);
                      setSelectedAssignment(null);
                      setSettlementFormData({ settlementType: '', amount: '', notes: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Request Balance Return' : 'Request Overdue Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Settlement Modal (from main table) */}
      {showEditSettlementModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => {
          setShowEditSettlementModal(false);
          setEditSettlementItems([]);
          setSelectedAssignment(null);
        }}>
          <div className="modal modal-large modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Settlement Items
              </h2>
              <button className="btn-close" onClick={() => {
                setShowEditSettlementModal(false);
                setEditSettlementItems([]);
                setSelectedAssignment(null);
              }}>×</button>
            </div>

            <div className="modal-body-scrollable">
              <div className="settlement-info">
                <div className="settlement-info-grid">
                  <div className="settlement-info-item">
                    <span className="info-label">Assignment ID:</span>
                    <span className="info-value">#{selectedAssignment.assignmentId}</span>
                  </div>
                  <div className="settlement-info-item">
                    <span className="info-label">Job ID:</span>
                    <span className="info-value">{selectedAssignment.jobId}</span>
                  </div>
                  <div className="settlement-info-item">
                    <span className="info-label">Assigned Amount:</span>
                    <span className="info-value">LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="edit-settlement-form">
                <div className="form-header">
                  <h3>Settlement Items</h3>
                  <button 
                    type="button" 
                    onClick={addNewSettlementItem} 
                    className="btn btn-secondary btn-add-item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add New Item
                  </button>
                </div>

                <div className="edit-settlement-items-list">
                  {editSettlementItems.map((item, index) => (
                    <div key={index} className={`edit-settlement-item-card ${item.isNew ? 'new-item' : ''}`}>
                      <div className="item-header">
                        <span className="item-number">#{index + 1}</span>
                        {item.isNew && <span className="new-badge">New</span>}
                        <button
                          type="button"
                          onClick={() => deleteEditSettlementItem(item)}
                          className="btn-delete-card"
                          title="Delete item"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="item-fields">
                        <div className="form-group">
                          <label>Item Name <span className="required">*</span></label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleEditSettlementItemChange(index, 'itemName', e.target.value)}
                            placeholder="Enter item name"
                            className="form-control"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Actual Cost (LKR) <span className="required">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.actualCost}
                            onChange={(e) => handleEditSettlementItemChange(index, 'actualCost', e.target.value)}
                            placeholder="0.00"
                            className="form-control"
                          />
                        </div>

                        {item.isNew && (
                          <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={!!item.hasBill}
                                onChange={(e) => handleEditSettlementItemChange(index, 'hasBill', e.target.checked)}
                              />
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                              Has Bill/Receipt
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="settlement-summary">
                  <div className="summary-row">
                    <span>Assigned Amount:</span>
                    <span>LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Spent:</span>
                    <span>LKR {formatAmount(editSettlementItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0))}</span>
                  </div>
                  <div className="summary-row total">
                    {editSettlementItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0) < selectedAssignment.assignedAmount ? (
                      <>
                        <span>Balance to Return:</span>
                        <span className="balance-positive">
                          LKR {formatAmount(selectedAssignment.assignedAmount - editSettlementItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0))}
                        </span>
                      </>
                    ) : editSettlementItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0) > selectedAssignment.assignedAmount ? (
                      <>
                        <span>Over Amount:</span>
                        <span className="balance-negative">
                          LKR {formatAmount(editSettlementItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0) - selectedAssignment.assignedAmount)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Exact Match:</span>
                        <span>LKR 0.00</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSettlementModal(false);
                      setEditSettlementItems([]);
                      setSelectedAssignment(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={saveAllSettlementChanges} 
                    className="btn btn-success"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Save All Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Management Settlement Section Component
const ManagementSettlementSection = ({ user }) => {
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const endpoint = `${API_BASE}/api/cash-balance-settlements`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data.data || []);
      } else {
        setMessage('Failed to fetch settlements');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setMessage('Error fetching settlements');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = settlements.filter(settlement => settlement.status === 'PENDING').length;
  const approvedCount = settlements.filter(settlement => settlement.status === 'APPROVED').length;
  const rejectedCount = settlements.filter(settlement => settlement.status === 'REJECTED').length;

  const filteredSettlements = settlements.filter(settlement => {
    if (activeTab === 'pending') return settlement.status === 'PENDING';
    if (activeTab === 'approved') return settlement.status === 'APPROVED';
    if (activeTab === 'rejected') return settlement.status === 'REJECTED';
    return true;
  });

  const handleApprove = async (settlementId, managerNotes = '') => {
    setActionLoading(prev => ({ ...prev, [settlementId]: 'approving' }));
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements/${settlementId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      if (response.ok) {
        setMessage('Settlement approved successfully');
        fetchSettlements();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to approve settlement');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error approving settlement:', error);
      setMessage('Error approving settlement');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const handleReject = async (settlementId, managerNotes) => {
    if (!managerNotes.trim()) {
      setMessage('Please provide a reason for rejection');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setActionLoading(prev => ({ ...prev, [settlementId]: 'rejecting' }));
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements/${settlementId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      if (response.ok) {
        setMessage('Settlement rejected successfully');
        fetchSettlements();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to reject settlement');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error rejecting settlement:', error);
      setMessage('Error rejecting settlement');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-assigned';
    }
  };

  return (
    <div className="card management-settlements">
      <div className="card-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
          </svg>
          Cash Balance Settlement Management
        </h2>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="settlement-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          title="View pending settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Pending ({pendingCount})
        </button>
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
          title="View approved settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Approved ({approvedCount})
        </button>
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
          title="View rejected settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          Rejected ({rejectedCount})
        </button>
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          title="View all settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          All Settlements
        </button>
      </div>

      <div className="settlements-content">
        {loading && <div className="loading">Loading settlements...</div>}
        
        {!loading && filteredSettlements.length === 0 && (
          <div className="empty-state">
            <p>No {activeTab} settlements found.</p>
          </div>
        )}

        {!loading && filteredSettlements.length > 0 && (
          <div className="settlements-table-wrapper">
            <table className="settlements-table">
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Waff Clerk</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Request Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map(settlement => (
                  <tr key={settlement.settlementId}>
                    <td data-label="Settlement ID">
                      <strong>{settlement.settlementId}</strong>
                    </td>
                    <td data-label="Waff Clerk">{settlement.userName}</td>
                    <td data-label="Type">
                      <span className={`type-badge ${settlement.settlementType === 'BALANCE_RETURN' ? 'type-return' : 'type-collect'}`}>
                        {settlement.settlementType === 'BALANCE_RETURN' ? 'Balance Return' : 'Overdue Collection'}
                      </span>
                    </td>
                    <td data-label="Amount">
                      <strong>LKR {settlement.amount.toLocaleString()}</strong>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${getStatusBadgeClass(settlement.status)}`}>
                        {settlement.statusDisplay}
                      </span>
                    </td>
                    <td data-label="Request Date">
                      {new Date(settlement.requestDate).toLocaleDateString()}
                    </td>
                    <td data-label="Actions">
                      <div className="settlement-actions">
                        {settlement.status === 'PENDING' && (
                          <>
                            <button
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(settlement.settlementId)}
                              disabled={actionLoading[settlement.settlementId]}
                            >
                              {actionLoading[settlement.settlementId] === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => {
                                const notes = prompt('Please provide a reason for rejection:');
                                if (notes) handleReject(settlement.settlementId, notes);
                              }}
                              disabled={actionLoading[settlement.settlementId]}
                            >
                              {actionLoading[settlement.settlementId] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PettyCash;


