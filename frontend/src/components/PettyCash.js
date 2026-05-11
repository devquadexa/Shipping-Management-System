import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { authService } from '../api/services/authService';
import { customerService } from '../api/services/customerService';
import { cashWithdrawalService } from '../api/services/cashWithdrawalService';
import CashWithdrawalModal from './CashWithdrawalModal';
import Pagination from './Pagination';
import '../styles/PettyCash.css';
import '../styles/CashWithdrawals.css';
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
  const [userCarouselIndex, setUserCarouselIndex] = useState(0);
  const [jobAssignments, setJobAssignments] = useState({}); // Store job assignments
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  // Collapsible section states
  const [assignmentsCollapsed, setAssignmentsCollapsed] = useState(false);
  
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

  // Cash Withdrawal states
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [cashWithdrawals, setCashWithdrawals] = useState([]);
  const [withdrawalsCollapsed, setWithdrawalsCollapsed] = useState(false);
  const [totalWithdrawnCash, setTotalWithdrawnCash] = useState(0);
  const [totalAssignedCash, setTotalAssignedCash] = useState(0);
  const [totalOtherExpenses, setTotalOtherExpenses] = useState(0);

  useEffect(() => {
    fetchAssignments();
    fetchJobs();
    fetchCustomers();
    fetchInvoicedJobs();
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
      fetchUsers();
      fetchOverallBalance();
      fetchCashWithdrawals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debug: Log when totals change
  useEffect(() => {
    console.log('💵 Balance Update:');
    console.log('  - Total Withdrawn:', totalWithdrawnCash);
    console.log('  - Petty Cash Assigned:', totalAssignedCash);
    console.log('  - Other Expenses:', totalOtherExpenses);
    console.log('  - Available:', totalWithdrawnCash - totalAssignedCash - totalOtherExpenses);
  }, [totalWithdrawnCash, totalAssignedCash, totalOtherExpenses]);
  
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

  // Reset to page 1 when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
        
        // Calculate total assigned cash
        const totalAssigned = data.reduce((sum, assignment) => {
          return sum + parseFloat(assignment.assignedAmount || 0);
        }, 0);
        console.log('📊 Total Assigned Cash:', totalAssigned);
        setTotalAssignedCash(totalAssigned);
        
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

  const fetchCashWithdrawals = async () => {
    try {
      const data = await cashWithdrawalService.getAll();
      setCashWithdrawals(data);
      
      // Calculate total withdrawn cash
      const total = data.reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount || 0), 0);
      console.log('💰 Total Withdrawn Cash:', total);
      setTotalWithdrawnCash(total);
      
      // Also fetch other expenses to calculate combined balance
      await fetchOtherExpenses();
    } catch (error) {
      console.error('Error fetching cash withdrawals:', error);
    }
  };

  const fetchOtherExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/other-expenses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const totalExpenses = data.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        console.log('💸 Total Other Expenses:', totalExpenses);
        setTotalOtherExpenses(totalExpenses);
      }
    } catch (error) {
      console.error('Error fetching other expenses:', error);
    }
  };

  const handleWithdrawalSubmit = async (withdrawalData) => {
    try {
      await cashWithdrawalService.create(withdrawalData);
      setMessage('Cash withdrawal recorded successfully');
      setTimeout(() => setMessage(''), 3000);
      setShowWithdrawalModal(false);
      fetchCashWithdrawals();
      fetchOverallBalance();
    } catch (error) {
      console.error('Error creating cash withdrawal:', error);
      setMessage('Error recording cash withdrawal');
      setTimeout(() => setMessage(''), 3000);
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
      setUsers(data.filter(u => u.role === 'Waff Clerk' || u.role === 'Manager'));
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
    'Settled / Balance Returned',
    'Settled / Over Due Collected',
    'Full Petty Cash Returned',
    'Balance Returned',
    'Overdue Collected',
    'Returned',
    'Paid'
  ];

  const isActiveAssignment = (assignment) => !closedAssignmentStatuses.includes(assignment.status);

  // Show all jobs that have assigned users and haven't been billed yet.
  // Availability for assignment is determined per-user by active (non-settled) petty cash entries.
  const getAvailableJobs = () => {
    console.log('=== getAvailableJobs ===');
    console.log('Total jobs:', jobs.length);
    console.log('jobAssignments:', jobAssignments);
    console.log('assignments (petty cash):', assignments.length);
    console.log('invoicedJobIds:', invoicedJobIds);
    
    const available = jobs.filter(job => {
      // Job must have assigned users
      if (!jobAssignments[job.jobId] || jobAssignments[job.jobId].length === 0) {
        console.log(`Job ${job.jobId}: FILTERED OUT - no assigned users`);
        return false;
      }

      // Job must not have a bill generated
      if (invoicedJobIds.has(job.jobId)) {
        console.log(`Job ${job.jobId}: FILTERED OUT - bill already generated`);
        return false;
      }

      console.log(`Job ${job.jobId}: INCLUDED - allowing multiple assignments per job`);
      return true;
    });

    console.log('Available jobs:', available.length);
    return available;
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
    
    console.log('=== handleAssignSubmit START ===');
    console.log('Form data:', assignFormData);
    
    if (!assignFormData.jobId || !assignFormData.assignedTo || !assignFormData.assignedAmount) {
      console.log('Validation failed - missing required fields');
      setMessage('Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const assignedAmountText = String(assignFormData.assignedAmount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(assignedAmountText)) {
      console.log('Validation failed - invalid amount format:', assignedAmountText);
      setMessage('Assigned amount must be a valid number');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const assignedAmount = parseFloat(assignedAmountText);
    if (Number.isNaN(assignedAmount) || assignedAmount <= 0) {
      console.log('Validation failed - invalid amount value:', assignedAmount);
      setMessage('Assigned amount must be greater than 0');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check available balance
    const availableBalance = totalWithdrawnCash - totalAssignedCash - totalOtherExpenses;
    if (availableBalance <= 0) {
      setMessage('❌ No available balance! Please record a cash withdrawal first.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (assignedAmount > availableBalance) {
      setMessage(`❌ Insufficient balance! Available: LKR ${formatAmount(availableBalance)}. You're trying to assign: LKR ${formatAmount(assignedAmount)}`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    console.log('Validation passed, sending request with data:', {
      jobId: assignFormData.jobId,
      assignedTo: assignFormData.assignedTo,
      assignedAmount: assignedAmount,
      notes: assignFormData.notes
    });

    try {
      const requestPayload = {
        ...assignFormData,
        assignedAmount
      };
      console.log('Request payload:', requestPayload);
      console.log('API endpoint:', `${API_BASE}/api/petty-cash-assignments`);
      console.log('Token present:', !!localStorage.getItem('token'));
      
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (response.ok) {
        console.log('Success! Assignment created');
        setMessage('Petty cash assigned successfully!');
        setAssignFormData({ jobId: '', assignedTo: '', assignedAmount: '', notes: '' });
        
        // Fetch updated data before closing modal
        await fetchAssignments();
        await fetchJobs();
        
        // Close modal after data is refreshed
        setShowAssignModal(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        console.error('API error response:', error);
        setMessage(error.message || 'Error assigning petty cash');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      console.error('Error details:', error.message);
      setMessage('Error assigning petty cash');
      setTimeout(() => setMessage(''), 3000);
    }
    console.log('=== handleAssignSubmit END ===');
  };

  const openSettleModal = async (assignment) => {
    console.log('Opening settle modal for assignment:', assignment);
    setSelectedAssignment(assignment);
    
    // Determine if settlement can be edited (before invoice generation)
    const canEdit = !invoicedJobIds.has(assignment.jobId) && 
                    (assignment.status === 'Settled' || 
                     assignment.status === 'Balance To Be Return' || 
                     assignment.status === 'Over Due');
    setCanEditSettlement(canEdit);
    console.log('Can edit settlement:', canEdit);
    
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
    
    /**
     * SETTLEMENT FLOW:
     * 1. NORMAL SCENARIO: Clerk enters item amounts -> validItems.length > 0
     *    - Settlement items are submitted to backend
     *    - Backend calculates actualSpent from items, determines status
     * 
     * 2. FULL RETURN SCENARIO: Clerk submits without entering amounts -> validItems.length === 0
     *    - User sees confirmation dialog explaining full return
     *    - If confirmed, empty items array is submitted
     *    - Backend receives no items, calculates actualSpent = 0
     *    - Backend sets status to 'Balance To Be Return' with full assigned amount
     *    - Clerk can request return of entire allocation (e.g., unable to complete job due to illness/leave)
     */
    const validItems = settlementItems.filter(item => 
      item.itemName && item.actualCost && parseFloat(item.actualCost) > 0 && !item.alreadyPaid
    );
    
    // If no items with amounts are entered, treat it as a full return request
    if (validItems.length === 0) {
      // Confirm with the user that they're returning the full assigned amount
      const confirmFullReturn = window.confirm(
        `You are submitting a full petty cash return request.\n\n` +
        `Assigned Amount: LKR ${formatAmount(selectedAssignment.assignedAmount)}\n` +
        `No items will be claimed as expenses.\n\n` +
        `This will be submitted for approval.\n\n` +
        `Continue with full return?`
      );
      
      if (!confirmFullReturn) {
        return;
      }
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
        // Close modal and clear state first
        setShowSettleModal(false);
        setSelectedAssignment(null);
        setSettlementItems([]);
        
        // Refresh data from backend
        console.log('Settle successful - refreshing assignments and jobs...');
        await Promise.all([
          fetchAssignments(),
          fetchJobs()
        ]);
        console.log('Data refresh complete after settlement');
        
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
      case 'Balance To Be Return': return 'status-balance-to-return';
      case 'Over Due': return 'status-overdue';
      case 'Pending Approval / Balance': return 'status-pending-approval-balance';
      case 'Pending Approval / Over Due': return 'status-pending-approval-overdue';
      case 'Settled / Balance Returned': return 'status-settled-balance-returned';
      case 'Settled / Over Due Collected': return 'status-settled-overdue-collected';
      case 'Full Petty Cash Returned': return 'status-full-petty-cash-returned';
      case 'Closed': return 'status-closed';
      // Legacy statuses for backward compatibility
      case 'Settled/Approved': return 'status-approved';
      case 'Settled/Rejected': return 'status-rejected';
      case 'Returned': return 'status-returned';
      case 'Paid': return 'status-paid';
      case 'Pending Approval': return 'status-pending-approval';
      case 'Balance Returned': return 'status-balance-returned';
      case 'Overdue Collected': return 'status-overdue-collected';
      default: return 'status-assigned';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Settled / Balance Returned': return 'Settled / BR';
      case 'Settled / Over Due Collected': return 'Settled / OC';
      default: return status;
    }
  };

  // Get filtered assignments count
  const getFilteredCount = () => {
    return assignments.filter(assignment => {
      // Status filter
      if (statusFilter !== 'all' && assignment.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const job = jobs.find(j => j.jobId === assignment.jobId);
        const customerName = job ? getCustomerName(job.customerId).toLowerCase() : '';
        const cusdecNumber = job?.cusdecNumber?.toLowerCase() || '';
        const jobId = assignment.jobId.toLowerCase();
        const assignedToName = (assignment.assignedToName || assignment.assignedTo || '').toLowerCase();
        
        const matchesSearch = 
          jobId.includes(searchLower) ||
          customerName.includes(searchLower) ||
          cusdecNumber.includes(searchLower) ||
          assignedToName.includes(searchLower);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    }).length;
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
              <span className="fin-stat-value">{assignment.actualSpent >= 0 ? `LKR ${formatAmount(assignment.actualSpent)}` : '—'}</span>
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
                  {(assignment.status === 'Settled' || assignment.status === 'Balance To Be Return' || assignment.status === 'Over Due') && (user?.role === 'Waff Clerk' || user?.role === 'Manager') && assignment.assignedTo === user?.userId && !invoicedJobIds.has(assignment.jobId) && (
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
                  const canEditItems = (assignment.status === 'Settled' || assignment.status === 'Balance To Be Return' || assignment.status === 'Over Due') && (user?.role === 'Waff Clerk' || user?.role === 'Manager') && assignment.assignedTo === user?.userId && !invoicedJobIds.has(assignment.jobId);
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
                                      <button className="inline-btn-edit" onClick={() => {
                                        if (invoicedJobIds.has(assignment.jobId)) { 
                                          setMessage('❌ Invoice already generated'); 
                                          setTimeout(() => setMessage(''), 3000); 
                                          return; 
                                        }
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
                        <div className={`settlement-table-row settlement-total-row ${assignment.status === 'Settled' && (user?.role === 'Waff Clerk' || user?.role === 'Manager') && assignment.assignedTo === user?.userId && !invoicedJobIds.has(assignment.jobId) ? 'with-actions' : ''}`}>
                          <div className="settlement-table-cell settlement-num-col"></div>
                          <div className="settlement-table-cell settlement-name-col"><strong>Total</strong></div>
                          <div className="settlement-table-cell settlement-type-col"></div>
                          <div className="settlement-table-cell settlement-bill-col"></div>
                          <div className="settlement-table-cell settlement-amount-col settlement-amount-value">
                            <strong>LKR {formatAmount(assignment.settlementItems.reduce((sum, i) => sum + parseFloat(i.actualCost || 0), 0))}</strong>
                          </div>
                          {assignment.status === 'Settled' && (user?.role === 'Waff Clerk' || user?.role === 'Manager') && assignment.assignedTo === user?.userId && !invoicedJobIds.has(assignment.jobId) && <div className="settlement-table-cell settlement-actions-col"></div>}
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

      {/* User Balances Summary for Admin/Super Admin — carousel */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && Object.keys(userBalances).length > 0 && (() => {
        const balanceList = Object.entries(userBalances);
        const CARDS_PER_VIEW = 4;
        const maxIndex = Math.max(0, balanceList.length - CARDS_PER_VIEW);
        const canPrev = userCarouselIndex > 0;
        const canNext = userCarouselIndex < maxIndex;
        const visible = balanceList.slice(userCarouselIndex, userCarouselIndex + CARDS_PER_VIEW);

        return (
          <div className="card">
            <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2>User Petty Cash Summary</h2>
              <span style={{fontSize:'13px', color:'#6b7280'}}>
                Showing {userCarouselIndex + 1}–{Math.min(userCarouselIndex + CARDS_PER_VIEW, balanceList.length)} of {balanceList.length} users
              </span>
            </div>

            <div className="ubc-wrapper">
              <div className="ubc-grid">
                {visible.map(([userId, balance]) => (
                  <div key={userId} className="user-balance-card">
                    <div className="user-balance-header">
                      <div className="user-avatar">{balance.userName.charAt(0).toUpperCase()}</div>
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
                ))}
              </div>

              {/* Carousel arrows — always visible */}
              <div className="ubc-arrows">
                <button
                  className={`ubc-arrow ${canPrev ? '' : 'disabled'}`}
                  onClick={() => canPrev && setUserCarouselIndex(i => i - 1)}
                  title="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div className="ubc-dots">
                  {Array.from({length: maxIndex + 1}).map((_, i) => (
                    <button
                      key={i}
                      className={`ubc-dot ${i === userCarouselIndex ? 'active' : ''}`}
                      onClick={() => setUserCarouselIndex(i)}
                    />
                  ))}
                </div>
                <button
                  className={`ubc-arrow ${canNext ? '' : 'disabled'}`}
                  onClick={() => canNext && setUserCarouselIndex(i => i + 1)}
                  title="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* User's Own Balance Summary */}
      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Cash Withdrawals Section */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
        <div className="card">
          <div className="card-header collapsible-header" onClick={() => setWithdrawalsCollapsed(c => !c)}>
            <h2>Cash Withdrawals from Bank ({cashWithdrawals.length})</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWithdrawalModal(true);
                }} 
                className="btn btn-primary"
              >
                + Record Withdrawal
              </button>
              <svg
                className={`collapse-arrow ${withdrawalsCollapsed ? 'collapsed' : ''}`}
                width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {!withdrawalsCollapsed && (
            <div className="card-body">
              {cashWithdrawals.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                  No cash withdrawals recorded yet
                </p>
              ) : (
                <div className="withdrawals-grid">
                  {cashWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.withdrawalId} className="withdrawal-box">
                      <div className="withdrawal-header">
                        <span className="withdrawal-id">{withdrawal.withdrawalId}</span>
                        <span className="withdrawal-amount">LKR {formatAmount(withdrawal.amount)}</span>
                      </div>
                      <div className="withdrawal-details">
                        <div className="withdrawal-row">
                          <span className="withdrawal-label">Bank:</span>
                          <span className="withdrawal-value">{withdrawal.bankName}</span>
                        </div>
                        <div className="withdrawal-row">
                          <span className="withdrawal-label">Date:</span>
                          <span className="withdrawal-value">
                            {new Date(withdrawal.withdrawalDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="withdrawal-row">
                          <span className="withdrawal-label">Recorded By:</span>
                          <span className="withdrawal-value">{withdrawal.createdByName || withdrawal.createdBy}</span>
                        </div>
                        {withdrawal.notes && (
                          <div className="withdrawal-notes">
                            <span className="withdrawal-label">Notes:</span>
                            <p>{withdrawal.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Management Settlement Section */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
        <ManagementSettlementSection user={user} />
      )}

      <div className="card">
        <div className="card-header collapsible-header" onClick={() => setAssignmentsCollapsed(c => !c)}>
          <h2>
            Petty Cash Assignments 
            {(searchTerm || statusFilter !== 'all') ? (
              <span> ({getFilteredCount()} of {assignments.length})</span>
            ) : (
              <span> ({assignments.length})</span>
            )}
          </h2>
          <svg
            className={`collapse-arrow ${assignmentsCollapsed ? 'collapsed' : ''}`}
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        {/* Search and Filter Bar */}
        {!assignmentsCollapsed && <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          <div className="filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Settled">Settled</option>
              <option value="Balance To Be Return">Balance To Be Return</option>
              <option value="Over Due">Over Due</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Pending Approval / Balance">Pending Approval / Balance</option>
              <option value="Pending Approval / Over Due">Pending Approval / Over Due</option>
              <option value="Balance Returned">Balance Returned</option>
              <option value="Overdue Collected">Overdue Collected</option>
              <option value="Settled / Balance Returned">Settled / Balance Returned</option>
              <option value="Settled / Over Due Collected">Settled / Over Due Collected</option>
              <option value="Settled/Approved">Settled/Approved</option>
              <option value="Settled/Rejected">Settled/Rejected</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>}
        
        {!assignmentsCollapsed && (assignments.length === 0 ? (
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
                  
                  // Filter assignments based on search term and status
                  const filteredAssignments = assignments.filter(assignment => {
                    // Status filter
                    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
                      return false;
                    }
                    
                    // Search filter
                    if (searchTerm.trim()) {
                      const searchLower = searchTerm.toLowerCase();
                      const job = jobs.find(j => j.jobId === assignment.jobId);
                      const customerName = job ? getCustomerName(job.customerId).toLowerCase() : '';
                      const cusdecNumber = job?.cusdecNumber?.toLowerCase() || '';
                      const jobId = assignment.jobId.toLowerCase();
                      const assignedToName = (assignment.assignedToName || assignment.assignedTo || '').toLowerCase();
                      
                      const matchesSearch = 
                        jobId.includes(searchLower) ||
                        customerName.includes(searchLower) ||
                        cusdecNumber.includes(searchLower) ||
                        assignedToName.includes(searchLower);
                      
                      if (!matchesSearch) {
                        return false;
                      }
                    }
                    
                    return true;
                  });
                  
                  const groupMap = new Map();
                  filteredAssignments.forEach(a => {
                    const gid = a.groupId || `${a.jobId}_${a.assignedTo}`;
                    console.log(`Assignment ${a.assignmentId}: jobId=${a.jobId}, assignedTo=${a.assignedTo}, groupId=${a.groupId}, calculated=${gid}`);
                    if (!groupMap.has(gid)) groupMap.set(gid, []);
                    groupMap.get(gid).push(a);
                  });
                  const groups = Array.from(groupMap.entries());
                  
                  console.log('Total groups:', groups.length);
                  console.log('Groups:', groups.map(([gid, assigns]) => ({ groupId: gid, count: assigns.length, ids: assigns.map(a => a.assignmentId) })));
                  console.log('=== END DEBUG ===');
                  
                  // Show "no results" message if filtered list is empty
                  if (groups.length === 0) {
                    return (
                      <tr>
                        <td colSpan="9" style={{textAlign: 'center', padding: '2rem'}}>
                          <div className="empty-state">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <p style={{marginTop: '1rem', color: '#6b7280'}}>
                              {searchTerm || statusFilter !== 'all' 
                                ? 'No assignments match your search criteria' 
                                : 'No assignments found'}
                            </p>
                            {(searchTerm || statusFilter !== 'all') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{marginTop: '1rem'}}
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('all');
                                }}
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Pagination logic for groups
                  const totalPages = Math.ceil(groups.length / recordsPerPage);
                  const indexOfLastRecord = currentPage * recordsPerPage;
                  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
                  const currentGroups = groups.slice(indexOfFirstRecord, indexOfLastRecord);

                  return currentGroups.map(([groupId, groupAssignments]) => {
                    const first = groupAssignments[0];
                    const job = jobs.find(j => j.jobId === first.jobId);
                    const isGroupExpanded = expandedRows.has(groupId);
                    const isMulti = groupAssignments.length > 1;

                    // Group-level aggregates
                    const totalAssigned = groupAssignments.reduce((s, a) => s + parseFloat(a.assignedAmount || 0), 0);
                    
                    // Collect all settlement items across all assignments in the group
                    // To handle grouped assignments correctly, we pull items from all assignments but deduplicate them
                    console.log('--- Aggregating Items (GroupId:', groupId, ') ---');
                    const allSettlementItems = groupAssignments.flatMap((a) => {
                      const items = a.settlementItems || [];
                      return items.map(item => ({ ...item, assignmentId: a.assignmentId }));
                    }).reduce((acc, item) => {
                      // Check if item already exists in accumulator to avoid duplication
                      // Match by name and cost for a robust check
                      const exists = acc.some(i => i.itemName === item.itemName && parseFloat(i.actualCost) === parseFloat(item.actualCost));
                      if (!exists) {
                        acc.push(item);
                      }
                      return acc;
                    }, []);
                    console.log('Final Aggregated Items:', allSettlementItems);

                    const totalSpent = allSettlementItems.reduce((s, i) => s + parseFloat(i.actualCost || 0), 0);
                    const totalBalance = totalAssigned > totalSpent ? totalAssigned - totalSpent : 0;
                    const totalOver = totalSpent > totalAssigned ? totalSpent - totalAssigned : 0;
                    const allSettled = groupAssignments.every(a => [
                      'Settled',
                      'Balance To Be Return',
                      'Over Due',
                      'Pending Approval / Balance',
                      'Pending Approval / Over Due',
                      'Settled / Balance Returned',
                      'Settled / Over Due Collected',
                      'Settled/Approved',
                      'Settled/Rejected',
                      'Balance Returned',
                      'Overdue Collected',
                      'Closed',
                      'Full Petty Cash Returned'
                    ].includes(a.status));
                    const anyAssigned = groupAssignments.some(a => a.status === 'Assigned');
                    // Status priority: most advanced status wins for the group display
                    const statusPriority = [
                      'Assigned',
                      'Settled',
                      'Balance To Be Return',
                      'Over Due',
                      'Settled/Rejected',
                      'Pending Approval',
                      'Pending Approval / Balance',
                      'Pending Approval / Over Due',
                      'Balance Returned',
                      'Overdue Collected',
                      'Settled / Balance Returned',
                      'Settled / Over Due Collected',
                      'Settled/Approved',
                      'Closed'
                    ];
                    const groupStatus = isMulti
                      ? (() => {
                          if (anyAssigned) return 'Assigned';
                          // Check if any assignment is Closed (invoice generated - bill created)
                          const hasClosed = groupAssignments.some(a => a.status === 'Closed');
                          if (hasClosed) return 'Closed';
                          // Check if any assignment has a pending approval status
                          const hasPendingApproval = groupAssignments.some(a => 
                            a.status === 'Pending Approval / Balance' || 
                            a.status === 'Pending Approval / Over Due' ||
                            a.status === 'Pending Approval'
                          );
                          if (hasPendingApproval) {
                            // Return the specific pending approval status if found
                            const pendingAssignment = groupAssignments.find(a => 
                              a.status === 'Pending Approval / Balance' || 
                              a.status === 'Pending Approval / Over Due' ||
                              a.status === 'Pending Approval'
                            );
                            return pendingAssignment.status;
                          }
                          // Check if all assignments have the same approved status
                          const allBalanceReturned = groupAssignments.every(a => a.status === 'Settled / Balance Returned');
                          const allOverDueCollected = groupAssignments.every(a => a.status === 'Settled / Over Due Collected');
                          const allApproved = groupAssignments.every(a => a.status === 'Settled/Approved');
                          const allFullReturned = groupAssignments.every(a => a.status === 'Full Petty Cash Returned');
                          
                          if (allBalanceReturned) return 'Settled / Balance Returned';
                          if (allOverDueCollected) return 'Settled / Over Due Collected';
                          if (allApproved) return 'Settled/Approved';
                          if (allFullReturned) return 'Full Petty Cash Returned';
                          
                          // Determine status based on group totals, not individual statuses
                          if (totalBalance > 0) return 'Balance To Be Return';
                          if (totalOver > 0) return 'Over Due';
                          // If all settled and no balance/over, return 'Settled'
                          return 'Settled';
                        })()
                      : groupAssignments[0].status;

                    // Balance/Over buttons: only show for Waff Clerks (not Managers)
                    // Managers get automatic final status after settlement
                    const canReturnBalance = !anyAssigned && user?.role === 'Waff Clerk' && first.assignedTo === user?.userId
                      && (groupStatus === 'Settled' || groupStatus === 'Balance To Be Return' || groupStatus === 'Settled/Rejected')
                      && groupStatus !== 'Pending Approval / Balance'
                      && groupStatus !== 'Pending Approval / Over Due'
                      && groupStatus !== 'Pending Approval'
                      && groupStatus !== 'Closed'
                      && groupStatus !== 'Full Petty Cash Returned'
                      && groupStatus !== 'Settled / Balance Returned'
                      && groupStatus !== 'Settled / Over Due Collected'
                      && (isMulti ? totalBalance > 0 : first.balanceAmount > 0);
                    const canCollectOverdue = !anyAssigned && user?.role === 'Waff Clerk' && first.assignedTo === user?.userId
                      && (groupStatus === 'Settled' || groupStatus === 'Over Due' || groupStatus === 'Settled/Rejected')
                      && groupStatus !== 'Pending Approval / Balance'
                      && groupStatus !== 'Pending Approval / Over Due'
                      && groupStatus !== 'Pending Approval'
                      && groupStatus !== 'Closed'
                      && groupStatus !== 'Full Petty Cash Returned'
                      && groupStatus !== 'Settled / Balance Returned'
                      && groupStatus !== 'Settled / Over Due Collected'
                      && (isMulti ? totalOver > 0 : first.overAmount > 0);

                    return (
                      <React.Fragment key={groupId}>
                        {/* Group Header Row */}
                        <tr className={`assignment-row ${isGroupExpanded ? 'expanded' : ''} ${isMulti ? 'group-row' : ''}`}>
                          <td data-label="Assignment ID">
                            {isMulti ? (
                              <strong className="assignment-id">#{first.assignmentId}</strong>
                            ) : (
                              <strong className="assignment-id">#{first.assignmentId}</strong>
                            )}
                          </td>
                          <td className="job-cusdec-cell" data-label="Job ID / CUSDEC">
                            {job && job.cusdecNumber ? (
                              <span>{first.jobId} / {job.cusdecNumber}</span>
                            ) : (
                              <span>{first.jobId}</span>
                            )}
                          </td>
                          <td className="customer-name-cell" data-label="Customer">{job ? getCustomerName(job.customerId) : '-'}</td>
                          <td className="assigned-to-cell" data-label="Assigned To">
                            <span className="assigned-to-name">{first.assignedToName || first.assignedTo || '-'}</span>
                          </td>
                          <td data-label="Status">
                            <span className={`status-badge ${getStatusBadgeClass(groupStatus)}`}>
                              {getStatusDisplay(groupStatus)}
                            </span>
                          </td>
                          <td data-label="Total Assigned"><strong>LKR {formatAmount(totalAssigned)}</strong></td>
                          <td data-label="Assigned Date">{new Date(first.assignedDate).toLocaleDateString()}</td>
                          <td data-label="Actions">
                            <div className="actions-cell-hybrid">
                              {/* Unified action logic for both single and grouped assignments */}
                              {/* Show settle button if user is assigned to this petty cash (Waff Clerk or Manager) */}
                              {anyAssigned && (user?.role === 'Waff Clerk' || user?.role === 'Manager') && first.assignedTo === user?.userId && (
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
                              {canReturnBalance && (
                                <button className="btn-return-balance btn-action" onClick={() => {
                                  const assignmentForModal = isMulti
                                    ? { ...first, balanceAmount: totalBalance, overAmount: totalOver, groupAssignmentIds: groupAssignments.map(a => a.assignmentId) }
                                    : first;
                                  openSettlementModal(assignmentForModal, 'BALANCE_RETURN');
                                }}>Return Balance</button>
                              )}
                              {canCollectOverdue && (
                                <button className="btn-collect-overdue btn-action" onClick={() => {
                                  const assignmentForModal = isMulti
                                    ? { ...first, balanceAmount: totalBalance, overAmount: totalOver, groupAssignmentIds: groupAssignments.map(a => a.assignmentId) }
                                    : first;
                                  openSettlementModal(assignmentForModal, 'OVERDUE_COLLECTION');
                                }}>Collect Overdue</button>
                              )}
                              {/* Always show eye icon for viewing details */}
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
                                {(allSettled || allSettlementItems.length > 0) && (
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
                                      {totalBalance > 0 && ![
                                        'Balance Returned',
                                        'Settled / Balance Returned',
                                        'Pending Approval / Balance',
                                        'Settled/Approved',
                                        'Closed'
                                      ].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Balance to Return</span>
                                            <span className="fin-stat-value positive">LKR {formatAmount(totalBalance)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Balance Returned — after approval or close */}
                                      {totalBalance > 0 && [
                                        'Balance Returned',
                                        'Settled / Balance Returned',
                                        'Settled/Approved',
                                        'Closed'
                                      ].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Balance Returned</span>
                                            <span className="fin-stat-value">LKR {formatAmount(totalBalance)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Over Amount — only before collection/close */}
                                      {totalOver > 0 && ![
                                        'Overdue Collected',
                                        'Settled / Over Due Collected',
                                        'Pending Approval / Over Due',
                                        'Settled/Approved',
                                        'Closed'
                                      ].includes(groupStatus) && (
                                        <>
                                          <div className="fin-stat-divider" />
                                          <div className="fin-stat-item">
                                            <span className="fin-stat-label">Over Amount</span>
                                            <span className="fin-stat-value negative">LKR {formatAmount(totalOver)}</span>
                                          </div>
                                        </>
                                      )}
                                      {/* Overdue Collected — after collection or close */}
                                      {totalOver > 0 && [
                                        'Overdue Collected',
                                        'Settled / Over Due Collected',
                                        'Settled/Approved',
                                        'Closed'
                                      ].includes(groupStatus) && (
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
                                            {(user?.role === 'Waff Clerk' || user?.role === 'Manager') && first.assignedTo === user?.userId && !invoicedJobIds.has(first.jobId) && (
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
                                            const canEdit = (user?.role === 'Waff Clerk' || user?.role === 'Manager') && first.assignedTo === user?.userId && !invoicedJobIds.has(first.jobId);
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
                                                                <button className="inline-btn-edit" onClick={() => {
                                                                  if (invoicedJobIds.has(first.jobId)) {
                                                                    setMessage('❌ Invoice already generated');
                                                                    setTimeout(() => setMessage(''), 3000);
                                                                    return;
                                                                  }
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
        ))}

        {!assignmentsCollapsed && assignments.length > 0 && (() => {
          // Calculate total groups for pagination
          const filteredAssignments = assignments.filter(assignment => {
            if (statusFilter !== 'all' && assignment.status !== statusFilter) {
              return false;
            }
            if (searchTerm.trim()) {
              const searchLower = searchTerm.toLowerCase();
              const job = jobs.find(j => j.jobId === assignment.jobId);
              const customerName = job ? getCustomerName(job.customerId).toLowerCase() : '';
              const cusdecNumber = job?.cusdecNumber?.toLowerCase() || '';
              const jobId = assignment.jobId.toLowerCase();
              const assignedToName = (assignment.assignedToName || assignment.assignedTo || '').toLowerCase();
              
              const matchesSearch = 
                jobId.includes(searchLower) ||
                customerName.includes(searchLower) ||
                cusdecNumber.includes(searchLower) ||
                assignedToName.includes(searchLower);
              
              if (!matchesSearch) {
                return false;
              }
            }
            return true;
          });
          
          const groupMap = new Map();
          filteredAssignments.forEach(a => {
            const gid = a.groupId || `${a.jobId}_${a.assignedTo}`;
            if (!groupMap.has(gid)) groupMap.set(gid, []);
            groupMap.get(gid).push(a);
          });
          const totalGroups = groupMap.size;
          const totalPages = Math.ceil(totalGroups / recordsPerPage);

          return totalGroups > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalGroups}
              recordsPerPage={recordsPerPage}
              onPageChange={(pageNumber) => {
                setCurrentPage(pageNumber);
                setExpandedRows(new Set());
              }}
              onRecordsPerPageChange={(newRecordsPerPage) => {
                setRecordsPerPage(newRecordsPerPage);
                setCurrentPage(1);
                setExpandedRows(new Set());
              }}
            />
          ) : null;
        })()}
      </div>
      {/* Assign Petty Cash Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal modal-medium">
            <div className="modal-header">
              <h2>Assign Petty Cash</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>

            {/* Cash Balance Summary */}
            <div className="cash-balance-summary">
              <div className="balance-item">
                <span className="balance-label">💰 Total Cash Withdrawn from Bank:</span>
                <span className="balance-value withdrawn">LKR {formatAmount(totalWithdrawnCash)}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">📤 Petty Cash Assigned:</span>
                <span className="balance-value assigned">LKR {formatAmount(totalAssignedCash)}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">📤 Other Expenses:</span>
                <span className="balance-value assigned">LKR {formatAmount(totalOtherExpenses)}</span>
              </div>
              <div className="balance-item highlight">
                <span className="balance-label">✅ Available to Assign:</span>
                <span className={`balance-value ${totalWithdrawnCash - totalAssignedCash - totalOtherExpenses >= 0 ? 'positive' : 'negative'}`}>
                  LKR {formatAmount(totalWithdrawnCash - totalAssignedCash - totalOtherExpenses)}
                </span>
              </div>
              {totalWithdrawnCash - totalAssignedCash - totalOtherExpenses < 0 && (
                <div className="balance-warning">
                  ⚠️ Warning: Total usage exceeds withdrawn cash! Consider recording more withdrawals.
                </div>
              )}
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
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={totalWithdrawnCash - totalAssignedCash - totalOtherExpenses <= 0}
                  title={totalWithdrawnCash - totalAssignedCash - totalOtherExpenses <= 0 ? 'No available balance. Please record a cash withdrawal first.' : ''}
                >
                  Assign Petty Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal modal-large modal-scrollable">
            <div className="modal-header">
              <h2>{(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Settled/Approved' || selectedAssignment.status === 'Settled/Rejected' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected' || selectedAssignment.status === 'Full Petty Cash Returned') ? 'Settlement Details' : 'Settle Petty Cash'}</h2>
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

            {(selectedAssignment.status === 'Settled' || 
              selectedAssignment.status === 'Balance To Be Return' || 
              selectedAssignment.status === 'Over Due' || 
              selectedAssignment.status === 'Pending Approval / Balance' || 
              selectedAssignment.status === 'Pending Approval / Over Due' || 
              selectedAssignment.status === 'Settled / Balance Returned' || 
              selectedAssignment.status === 'Settled / Over Due Collected' || 
              selectedAssignment.status === 'Pending Approval' || 
              selectedAssignment.status === 'Settled/Approved' || 
              selectedAssignment.status === 'Settled/Rejected' || 
              selectedAssignment.status === 'Balance Returned' || 
              selectedAssignment.status === 'Overdue Collected' ||
              selectedAssignment.status === 'Closed') ? (
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
                <p className="helper-text info">Fill in only the items you paid for. Tick the "Bill" checkbox if you have a proof receipt for that item. Items already paid in other assignments are shown as read-only. You can also submit <strong>without entering any amounts</strong> to return the full petty cash allocation.</p>
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
                  {settlementItems.filter(i => !i.alreadyPaid).length === 0 && (
                    <div className="full-return-notice">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span><strong>Full Return:</strong> Submitting without item amounts will return the entire LKR {formatAmount(selectedAssignment.assignedAmount)} and require approval.</span>
                    </div>
                  )}
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
        <div className="modal-overlay">
          <div className="modal modal-large modal-scrollable">
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

      {/* Cash Withdrawal Modal */}
      <CashWithdrawalModal
        show={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSubmit={handleWithdrawalSubmit}
      />
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
  const [collapsed, setCollapsed] = useState(false);

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
      <div className="card-header collapsible-header" onClick={() => setCollapsed(c => !c)}>
        <h2>
          Cash Balance Settlement Management
        </h2>
        <svg
          className={`collapse-arrow ${collapsed ? 'collapsed' : ''}`}
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {!collapsed && (<>

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
      </>)}
    </div>
  );
};

export default PettyCash;


