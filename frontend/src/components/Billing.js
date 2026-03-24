import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingService } from '../api/services/billingService';
import { jobService } from '../api/services/jobService';
import { customerService } from '../api/services/customerService';
import API_BASE from '../api/config';
import '../styles/Billing.css';

function Billing() {
  const { user } = useAuth();
  
  // Format number with thousand separators
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const isVehicleShipmentCategory = (category) => {
    return category === 'Vehicle - Personal' || category === 'Vehicle - Company' || category === 'Vehicle';
  };
  const [bills, setBills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [message, setMessage] = useState('');
  const [showPayItemsRow, setShowPayItemsRow] = useState(false);
  const [payItems, setPayItems] = useState([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [printMode, setPrintMode] = useState('color');
  
  // New states for pay item editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayItem, setEditingPayItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editBillingAmount, setEditBillingAmount] = useState('');

  useEffect(() => {
    fetchBills();
    fetchJobs();
    fetchCustomers();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await billingService.getBills();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
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

  const handleJobSelect = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false, paidBy: '', paidByName: '' }]);
      setShowPayItemsRow(false);
      return;
    }
    
    console.log('handleJobSelect - jobId:', jobId);
    
    // Fetch fresh job data
    try {
      const allJobs = await jobService.getAll();
      const job = allJobs.find(j => j.jobId === jobId);
      
      console.log('handleJobSelect - found job:', job);
      console.log('handleJobSelect - job pettyCashStatus:', job?.pettyCashStatus);
      
      setSelectedJob(job);
      setShowPayItemsRow(false);
      
      // Collect all pay items from different sources
      let allPayItems = [];
      
      // 1. Load Office Pay Items (upfront payments by office staff)
      try {
        const officePayItemsResponse = await fetch(`${API_BASE}/api/office-pay-items/job/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (officePayItemsResponse.ok) {
          const officePayItems = await officePayItemsResponse.json();
          console.log('Office pay items:', officePayItems);
          
          // Add office pay items to the list
          officePayItems.forEach(item => {
            allPayItems.push({
              name: item.description,
              actualCost: item.actualCost,
              billingAmount: item.billingAmount || '', // May already be set
              sameAmount: false,
              paidBy: item.paidBy,
              paidByName: item.paidByName,
              isOfficePayItem: true,
              officePayItemId: item.officePayItemId
            });
          });
        }
      } catch (error) {
        console.error('Error loading office pay items:', error);
      }
      
      // 2. Load Petty Cash Settlement Items (if settled)
      if (job?.pettyCashStatus === 'Settled') {
        console.log('Petty cash is settled, loading ALL settlement data...');
        setLoadingSettlement(true);
        try {
          // Fetch ALL assignments for this job
          const response = await fetch(`${API_BASE}/api/petty-cash-assignments/job/${jobId}/all`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('Settlement response status:', response.status);
          
          if (response.ok) {
            const assignments = await response.json();
            console.log('All assignments for job:', assignments);
            
            // Collect ALL settlement items from ALL assignments
            if (Array.isArray(assignments)) {
              assignments.forEach(assignment => {
                if (assignment.settlementItems && Array.isArray(assignment.settlementItems)) {
                  assignment.settlementItems.forEach(item => {
                    allPayItems.push({
                      name: item.itemName,
                      actualCost: item.actualCost,
                      billingAmount: '', // Leave empty for Admin/Manager to fill
                      sameAmount: false,
                      paidBy: item.paidBy || assignment.assignedTo,
                      paidByName: item.paidByName || assignment.assignedToName,
                      isCustomItem: item.isCustomItem,
                      isPettyCashItem: true
                    });
                  });
                }
              });
            }
          } else {
            const errorText = await response.text();
            console.log('Failed to fetch settlements. Status:', response.status, 'Error:', errorText);
          }
        } catch (error) {
          console.error('Error loading settlement:', error);
        } finally {
          setLoadingSettlement(false);
        }
      }
      
      // 3. Smart UI Logic: Only show entry form if no pay items exist in the job
      if (allPayItems.length > 0) {
        setPayItems(allPayItems);
        
        // SMART UI: Only show entry form if the job doesn't have saved pay items
        // If job already has pay items, show only the review table
        const hasExistingPayItems = job.payItems && job.payItems.length > 0;
        setShowPayItemsRow(!hasExistingPayItems);
        
        const officeItemsCount = allPayItems.filter(item => item.isOfficePayItem).length;
        const pettyCashItemsCount = allPayItems.filter(item => item.isPettyCashItem).length;
        
        let message;
        if (hasExistingPayItems) {
          message = `📋 Job has ${job.payItems.length} saved pay items. Use "+ Add More Items" to add additional items.`;
        } else {
          message = `✅ Loaded ${allPayItems.length} items: `;
          if (officeItemsCount > 0) message += `${officeItemsCount} office payments`;
          if (pettyCashItemsCount > 0) {
            if (officeItemsCount > 0) message += `, `;
            message += `${pettyCashItemsCount} petty cash items`;
          }
          message += '. Please review billing amounts.';
        }
        
        setMessage(message);
        setTimeout(() => setMessage(''), 5000);
      } else {
        // No items found from office/petty cash, check if job has existing pay items
        const hasExistingPayItems = job.payItems && job.payItems.length > 0;
        
        if (hasExistingPayItems) {
          // Job has existing pay items, don't show entry form
          setShowPayItemsRow(false);
          setMessage(`📋 Job has ${job.payItems.length} saved pay items. Use "+ Add More Items" to add additional items.`);
          setTimeout(() => setMessage(''), 5000);
        } else {
          // No existing pay items, show entry form or load templates
          if (job?.pettyCashStatus !== 'Settled') {
            setMessage('Petty cash must be settled before generating invoice');
            setTimeout(() => setMessage(''), 3000);
          } else {
            // Load templates for first-time entry
            loadPayItemTemplates(job);
          }
        }
        setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false, paidBy: '', paidByName: '' }]);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setMessage('Error loading job details');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadPayItemTemplates = async (job) => {
    // Auto-load pay item templates based on shipment category
    if (job?.shipmentCategory && (!job.payItems || job.payItems.length === 0)) {
      console.log('Loading pay item templates for category:', job.shipmentCategory);
      try {
        const response = await fetch(`${API_BASE}/api/pay-item-templates/category/${encodeURIComponent(job.shipmentCategory)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const templates = await response.json();
          console.log('Loaded templates:', templates);
          
          if (templates && templates.length > 0) {
            // Convert templates to pay items format
            const loadedPayItems = templates.map(template => ({
              name: template.itemName,
              actualCost: '',
              billingAmount: '',
              sameAmount: false
            }));
            
            setPayItems(loadedPayItems);
            setShowPayItemsRow(true);
            setMessage(`Loaded ${templates.length} default pay items for ${job.shipmentCategory}`);
            setTimeout(() => setMessage(''), 3000);
          } else {
            setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
          }
        }
      } catch (error) {
        console.error('Error loading pay item templates:', error);
        setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
      }
    } else {
      setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
    }
  };

  const addPayItemRow = () => {
    setPayItems([...payItems, { name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
  };

  const removePayItemRow = (index) => {
    const newPayItems = payItems.filter((_, i) => i !== index);
    setPayItems(newPayItems.length > 0 ? newPayItems : [{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
  };

  const handlePayItemChange = (index, field, value) => {
    const newPayItems = [...payItems];
    newPayItems[index][field] = value;
    
    // If sameAmount checkbox is checked, copy actualCost to billingAmount
    if (field === 'sameAmount' && value) {
      newPayItems[index].billingAmount = newPayItems[index].actualCost;
    }
    
    // If actualCost changes and sameAmount is checked, update billingAmount
    if (field === 'actualCost' && newPayItems[index].sameAmount) {
      newPayItems[index].billingAmount = value;
    }
    
    setPayItems(newPayItems);
  };

  const savePayItems = async () => {
    // Validate pay items - must have name, actualCost, and billingAmount
    const validPayItems = payItems.filter(item => {
      return item.name && 
             (item.actualCost || item.actualCost === 0) && 
             (item.billingAmount || item.billingAmount === 0);
    });
    
    if (validPayItems.length === 0) {
      setMessage('Please fill in all required fields (Description, Actual Cost, Billing Amount) for at least one pay item');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    try {
      console.log('=== SAVE PAY ITEMS START ===');
      console.log('New pay items to save:', validPayItems);
      console.log('Existing job pay items:', selectedJob.payItems);
      
      // Separate office pay items, petty cash items, and custom pay items
      const officePayItems = validPayItems.filter(item => item.isOfficePayItem);
      const pettyCashItems = validPayItems.filter(item => item.isPettyCashItem);
      const customPayItems = validPayItems.filter(item => !item.isOfficePayItem && !item.isPettyCashItem);
      
      console.log('Office pay items to update:', officePayItems);
      console.log('Petty cash items to update:', pettyCashItems);
      console.log('Custom pay items to add:', customPayItems);
      
      // 1. Update billing amounts for office pay items
      for (const item of officePayItems) {
        if (item.officePayItemId) {
          try {
            const response = await fetch(`${API_BASE}/api/office-pay-items/${item.officePayItemId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                billingAmount: parseFloat(item.billingAmount)
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update office pay item: ${response.statusText}`);
            }
            
            console.log(`✓ Updated billing amount for office pay item ${item.officePayItemId}`);
          } catch (error) {
            console.error(`✗ Error updating office pay item ${item.officePayItemId}:`, error);
            throw error;
          }
        }
      }
      
      // 2. Update billing amounts for petty cash items (if needed)
      for (const item of pettyCashItems) {
        console.log(`Petty cash item: ${item.name} - Actual: ${item.actualCost}, Billing: ${item.billingAmount}`);
        // Petty cash items are typically read-only in the billing section
        // but we log them for reference
      }
      
      // 3. APPEND new pay items to existing ones instead of replacing
      // Get existing pay items from the job
      const existingPayItems = selectedJob.payItems || [];
      console.log('Existing pay items count:', existingPayItems.length);
      
      // Convert new pay items to the format expected by the job
      const newPayItemsData = validPayItems.map(item => ({
        description: item.name,
        amount: parseFloat(item.actualCost),
        actualCost: parseFloat(item.actualCost),
        billingAmount: parseFloat(item.billingAmount),
        paidBy: item.paidByName || item.paidBy || 'Office',
        source: item.isOfficePayItem ? 'Office Payment' : item.isPettyCashItem ? 'Petty Cash' : 'Custom'
      }));
      
      // Combine existing and new pay items
      const allPayItemsData = [...existingPayItems, ...newPayItemsData];
      
      console.log('New pay items to add:', newPayItemsData);
      console.log('Combined pay items (existing + new):', allPayItemsData);
      
      // Save combined pay items to the job
      await jobService.replacePayItems(selectedJob.jobId, allPayItemsData);
      console.log('✓ All pay items saved successfully');

      const isAddingToExisting = existingPayItems.length > 0;
      const addedCount = newPayItemsData.length;
      const totalCount = allPayItemsData.length;
      
      if (isAddingToExisting) {
        setMessage(`✓ Added ${addedCount} new pay item(s) successfully! Total: ${totalCount} items. Review below and generate invoice.`);
      } else {
        setMessage(`✓ ${addedCount} pay item(s) saved successfully! Review the details below and generate invoice.`);
      }
      
      setShowPayItemsRow(false);
      
      // Refresh jobs and selected job to show the saved pay items
      console.log('Refreshing jobs after save...');
      const updatedJobs = await jobService.getAll();
      const updatedJob = updatedJobs.find(j => j.jobId === selectedJob.jobId);
      
      console.log('Updated selected job with pay items:', updatedJob);
      console.log('Updated job payItems:', updatedJob?.payItems);
      console.log('Updated job payItems length:', updatedJob?.payItems?.length);
      
      if (updatedJob) {
        setSelectedJob(updatedJob);
        console.log('✓ Selected job updated successfully');
      } else {
        console.error('❌ Could not find updated job');
        // Fallback: just update the current selectedJob with new pay items
        setSelectedJob({
          ...selectedJob,
          payItems: allPayItemsData
        });
      }
      
      // Reset the pay items form
      setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
      
      setTimeout(() => setMessage(''), 5000);
      console.log('=== SAVE PAY ITEMS END ===');
    } catch (error) {
      console.error('Error saving pay items:', error);
      setMessage(`Error saving pay items: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const calculateTotals = () => {
    if (!selectedJob || !selectedJob.payItems) {
      console.log('calculateTotals - No job or pay items');
      return { actualCost: 0, billingAmount: 0, profit: 0, grossTotal: 0, advancePayment: 0, netTotal: 0 };
    }
    
    console.log('calculateTotals - payItems:', selectedJob.payItems);
    
    const actualCost = selectedJob.payItems.reduce((sum, item) => {
      const value = parseFloat(item.actualCost) || parseFloat(item.amount) || 0;
      console.log(`calculateTotals - actualCost item: ${item.description}, value: ${value}`);
      return sum + value;
    }, 0);
    
    const billingAmount = selectedJob.payItems.reduce((sum, item) => {
      const value = parseFloat(item.billingAmount) || parseFloat(item.amount) || 0;
      console.log(`calculateTotals - billingAmount item: ${item.description}, value: ${value}`);
      return sum + value;
    }, 0);
    
    const profit = billingAmount - actualCost;
    const grossTotal = billingAmount; // Total before advance deduction
    const advancePayment = parseFloat(selectedJob.advancePayment) || 0;
    const netTotal = grossTotal - advancePayment; // Final amount after advance deduction
    
    console.log('calculateTotals - result:', { actualCost, billingAmount, profit, grossTotal, advancePayment, netTotal });
    console.log('calculateTotals - formatted result:', { 
      actualCost: formatAmount(actualCost), 
      billingAmount: formatAmount(billingAmount), 
      profit: formatAmount(profit),
      grossTotal: formatAmount(grossTotal),
      advancePayment: formatAmount(advancePayment),
      netTotal: formatAmount(netTotal)
    });
    
    return { actualCost, billingAmount, profit, grossTotal, advancePayment, netTotal };
  };

  // Helper function to check if user can edit pay items
  const canEditPayItems = () => {
    return user?.role === 'Super Admin' || user?.role === 'Admin';
  };

  // Open edit modal for a pay item
  const openEditModal = (payItem, index) => {
    if (!canEditPayItems()) {
      setMessage('❌ Only Super Admin and Admin users can edit pay items. Please contact an administrator for changes.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    setEditingPayItem(payItem);
    setEditingIndex(index);
    setEditBillingAmount(payItem.billingAmount || payItem.amount || '');
    setShowEditModal(true);
  };

  // Save edited pay item
  const saveEditedPayItem = async () => {
    if (!editingPayItem || editingIndex === -1) return;
    
    const newBillingAmount = parseFloat(editBillingAmount);
    if (isNaN(newBillingAmount) || newBillingAmount < 0) {
      setMessage('❌ Please enter a valid billing amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      // Update the pay item in the selectedJob
      const updatedPayItems = [...selectedJob.payItems];
      updatedPayItems[editingIndex] = {
        ...updatedPayItems[editingIndex],
        billingAmount: newBillingAmount
      };

      // Save to backend
      await jobService.replacePayItems(selectedJob.jobId, updatedPayItems);
      
      // Update local state
      setSelectedJob({
        ...selectedJob,
        payItems: updatedPayItems
      });

      setMessage('✅ Pay item billing amount updated successfully');
      setShowEditModal(false);
      setEditingPayItem(null);
      setEditingIndex(-1);
      setEditBillingAmount('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating pay item:', error);
      setMessage('❌ Error updating pay item. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Remove a pay item
  const removePayItem = async (index) => {
    if (!canEditPayItems()) {
      setMessage('❌ Only Super Admin and Admin users can remove pay items. Please contact an administrator for changes.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    const payItem = selectedJob.payItems[index];
    const confirmMessage = `Are you sure you want to remove "${payItem.description}" from the invoice?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Remove the pay item from the array
      const updatedPayItems = selectedJob.payItems.filter((_, i) => i !== index);

      // Save to backend
      await jobService.replacePayItems(selectedJob.jobId, updatedPayItems);
      
      // Update local state
      setSelectedJob({
        ...selectedJob,
        payItems: updatedPayItems
      });

      setMessage('✅ Pay item removed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing pay item:', error);
      setMessage('❌ Error removing pay item. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateBill = async () => {
    console.log('=== GENERATE BILL START ===');
    console.log('generateBill - selectedJob:', selectedJob);
    
    if (!selectedJob) {
      setMessage('Please select a job first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    // Validate required fields before generating invoice
    const missingFields = [];
    if (!selectedJob.blNumber || (typeof selectedJob.blNumber === 'string' && selectedJob.blNumber.trim() === '')) {
      missingFields.push('BL Number');
    }
    if (!selectedJob.cusdecNumber || (typeof selectedJob.cusdecNumber === 'string' && selectedJob.cusdecNumber.trim() === '')) {
      missingFields.push('CUSDEC Number');
    }
    if (!selectedJob.lcNumber || (typeof selectedJob.lcNumber === 'string' && selectedJob.lcNumber.trim() === '')) {
      missingFields.push('LC Number');
    }
    if (!selectedJob.containerNumber || (typeof selectedJob.containerNumber === 'string' && selectedJob.containerNumber.trim() === '')) {
      missingFields.push('Container Number');
    }
    if (
      isVehicleShipmentCategory(selectedJob.shipmentCategory) &&
      (!selectedJob.chassisNumber || (typeof selectedJob.chassisNumber === 'string' && selectedJob.chassisNumber.trim() === ''))
    ) {
      missingFields.push('Chassis Number');
    }
    console.log('generateBill - missingFields:', missingFields);
    
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(', ');
      console.error('BLOCKING INVOICE GENERATION - Missing fields:', fieldsList);
      setValidationMessage(`Please edit the job and complete the following required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
      setShowValidationModal(true);
      return; // STOP HERE - Do not proceed with invoice generation
    }
    
    console.log('generateBill - All required fields present, continuing...');
    
    // Check if petty cash is settled
    console.log('generateBill - pettyCashStatus:', selectedJob.pettyCashStatus);
    if (selectedJob.pettyCashStatus === 'Assigned') {
      setMessage('Cannot generate invoice: Petty cash must be settled first');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    console.log('generateBill - selectedJob.payItems:', selectedJob.payItems);
    console.log('generateBill - payItems length:', selectedJob.payItems?.length);
    console.log('generateBill - payItems type:', typeof selectedJob.payItems);
    console.log('generateBill - payItems is array:', Array.isArray(selectedJob.payItems));
    
    if (!selectedJob.payItems || selectedJob.payItems.length === 0) {
      setMessage('Please add pay items before generating invoice');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      console.log('generateBill - calling calculateTotals...');
      const totals = calculateTotals();
      console.log('generateBill - calculated totals:', totals);
      
      if (totals.actualCost === 0 && totals.billingAmount === 0) {
        console.error('ERROR: Totals are 0! Pay items:', selectedJob.payItems);
        setMessage('Error: Unable to calculate totals. Please refresh and try again.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      const billData = {
        jobId: selectedJob.jobId,
        actualCost: totals.actualCost,
        billingAmount: totals.billingAmount,
        advancePayment: totals.advancePayment,
        grossTotal: totals.grossTotal,
        netTotal: totals.netTotal
      };
      console.log('generateBill - sending billData:', billData);
      
      await billingService.createBill(billData);
      
      setMessage('Invoice generated successfully!');
      setSelectedJob(null);
      fetchBills();
      setTimeout(() => setMessage(''), 3000);
      console.log('=== GENERATE BILL END ===');
    } catch (error) {
      console.error('Error generating invoice:', error);
      setMessage('Error generating invoice');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.name : customerId;
  };

  const getCustomerDetails = (customerId) => {
    return customers.find(c => c.customerId === customerId);
  };

  const markAsPaid = async (billId) => {
    try {
      await billingService.updateBill(billId, { paymentStatus: 'Paid' });
      fetchBills();
      setMessage('Invoice marked as paid!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const printBill = async (bill) => {
    try {
      console.log('printBill - bill object:', bill);
      console.log('printBill - bill.jobId:', bill.jobId);
      
      // Fetch complete job details including pay items
      const response = await fetch(`${API_BASE}/api/jobs/${bill.jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const jobWithPayItems = await response.json();
      const customer = getCustomerDetails(bill.customerId);
      
      if (!jobWithPayItems || !customer) {
        setMessage('Unable to print invoice - missing data');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      console.log('printBill - complete job data:', jobWithPayItems);
      console.log('printBill - job.payItems:', jobWithPayItems.payItems);
      console.log('printBill - job.payItems type:', typeof jobWithPayItems.payItems);
      console.log('printBill - job.payItems length:', jobWithPayItems.payItems?.length);
      console.log('printBill - job.payItems is array:', Array.isArray(jobWithPayItems.payItems));
      console.log('printBill - job.advancePayment:', jobWithPayItems.advancePayment);
      
      // Additional debugging for pay items
      if (jobWithPayItems.payItems) {
        console.log('printBill - pay items detailed analysis:');
        if (typeof jobWithPayItems.payItems === 'string') {
          console.log('   Pay items is a string, attempting to parse...');
          try {
            const parsed = JSON.parse(jobWithPayItems.payItems);
            console.log('   Parsed pay items:', parsed);
            jobWithPayItems.payItems = parsed; // Replace with parsed version
          } catch (e) {
            console.log('   Failed to parse pay items string:', e.message);
          }
        } else if (Array.isArray(jobWithPayItems.payItems)) {
          console.log('   Pay items is an array with', jobWithPayItems.payItems.length, 'items:');
          jobWithPayItems.payItems.forEach((item, index) => {
            console.log(`   Item ${index + 1}:`, item);
          });
        } else {
          console.log('   Pay items is neither string nor array:', jobWithPayItems.payItems);
        }
      } else {
        console.log('printBill - No pay items found in job data');
      }
      
      console.log('printBill - bill data for comparison:', {
        billId: bill.billId,
        jobId: bill.jobId,
        billingAmount: bill.billingAmount,
        advancePayment: bill.advancePayment,
        grossTotal: bill.grossTotal,
        netTotal: bill.netTotal
      });

      const printWindow = window.open('', '', 'height=900,width=700');
      printWindow.document.write(generateBillHTML(bill, jobWithPayItems, customer, printMode));
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing bill:', error);
      setMessage('Error loading invoice data for printing');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateBillHTML = (bill, job, customer, mode = 'color') => {
    const isColorMode = mode === 'color';
    const billDate = new Date(bill.billDate || bill.createdDate).toLocaleDateString('en-GB');
    const invoiceNumber = bill.invoiceNumber || bill.billId;
    const invoiceLogoUrl = `${window.location.origin}/logo2.png`;
    
    console.log('generateBillHTML - bill:', bill);
    console.log('generateBillHTML - job:', job);
    console.log('generateBillHTML - job.payItems:', job.payItems);
    console.log('generateBillHTML - job.advancePayment:', job.advancePayment);
    console.log('generateBillHTML - bill.advancePayment:', bill.advancePayment);
    console.log('generateBillHTML - customer:', customer);
    
    // Use job's advance payment if bill doesn't have it
    const advancePayment = parseFloat(bill.advancePayment || job.advancePayment || 0);
    const rawAdvancePaymentDate = bill.advancePaymentDate || bill.paymentMadeDate || job.advancePaymentDate || job.paymentMadeDate;
    const parsedAdvancePaymentDate = rawAdvancePaymentDate ? new Date(rawAdvancePaymentDate) : null;
    const advancePaymentDateText = parsedAdvancePaymentDate && !Number.isNaN(parsedAdvancePaymentDate.getTime())
      ? parsedAdvancePaymentDate.toLocaleDateString('en-GB')
      : '-';
    const advancePaymentLabel = `Advance payment (${advancePaymentDateText})`;
    const grossTotal = parseFloat(bill.grossTotal || bill.billingAmount || 0);
    const netTotal = grossTotal - advancePayment; // Always calculate, don't use bill.netTotal
    
    console.log('generateBillHTML - calculated values:', {
      advancePayment,
      grossTotal,
      netTotal,
      hasAdvance: advancePayment > 0,
      calculation: `${grossTotal} - ${advancePayment} = ${netTotal}`
    });
    
    // Handle pay items - they might be a string that needs parsing
    let payItemsArray = [];
    if (job.payItems) {
      if (typeof job.payItems === 'string') {
        try {
          payItemsArray = JSON.parse(job.payItems);
          console.log('generateBillHTML - parsed pay items from string:', payItemsArray);
        } catch (e) {
          console.log('generateBillHTML - failed to parse pay items string:', e.message);
          payItemsArray = [];
        }
      } else if (Array.isArray(job.payItems)) {
        payItemsArray = job.payItems;
        console.log('generateBillHTML - using pay items array:', payItemsArray);
      } else {
        console.log('generateBillHTML - pay items is neither string nor array:', job.payItems);
        payItemsArray = [];
      }
    } else {
      console.log('generateBillHTML - no pay items found in job');
      payItemsArray = [];
    }

    const isCompactItemsLayout = payItemsArray.length >= 20;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Super Shine Cargo Services</title>
        <style>
          :root {
            --theme-primary: ${isColorMode ? '#1a3e9a' : '#000000'};
            --theme-accent: ${isColorMode ? '#2f6bd6' : '#000000'};
            --theme-muted: ${isColorMode ? '#3f4f77' : '#333333'};
            --theme-soft: ${isColorMode ? '#e8f0ff' : '#ffffff'};
          }
          @page { 
            margin: ${isCompactItemsLayout ? '10mm 14mm' : '15mm 20mm'}; 
            size: A4;
          }
          * {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
            line-height: ${isCompactItemsLayout ? '1.22' : '1.3'};
            color: #111;
          }
          .invoice-page {
            min-height: ${isCompactItemsLayout ? '275mm' : '258mm'};
            display: flex;
            flex-direction: column;
          }
          .page-header {
            position: relative;
            margin-bottom: ${isCompactItemsLayout ? '8px' : '15px'};
            padding: ${isCompactItemsLayout ? '6px 8px 8px 8px' : '8px 10px 10px 10px'};
            border-bottom: 2px solid var(--theme-primary);
            background: ${isColorMode ? 'linear-gradient(180deg, var(--theme-soft) 0%, #ffffff 100%)' : '#ffffff'};
            border-radius: 6px;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: ${isCompactItemsLayout ? '10px' : '15px'};
          }
          .logo {
            width: ${isCompactItemsLayout ? '62px' : '72px'};
            height: ${isCompactItemsLayout ? '62px' : '72px'};
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
            overflow: hidden;
            background: #fff;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .company-header {
            text-align: center;
            margin-bottom: 0;
          }
          .company-name {
            font-size: ${isCompactItemsLayout ? '12pt' : '13pt'};
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 3px;
            color: var(--theme-primary);
          }
          .company-tagline {
            font-size: ${isCompactItemsLayout ? '7.5pt' : '8pt'};
            margin: 1px 0;
            color: var(--theme-muted);
          }
          .invoice-header-right {
            text-align: right;
            font-size: ${isCompactItemsLayout ? '8.5pt' : '9pt'};
            line-height: 1.5;
            color: var(--theme-primary);
            font-weight: 600;
          }
          .invoice-header-right strong {
            display: block;
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
          }
          .recipient {
            margin: ${isCompactItemsLayout ? '8px 0' : '15px 0'};
            line-height: 1.5;
          }
          .recipient-line {
            margin: ${isCompactItemsLayout ? '1px 0' : '2px 0'};
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
          }
          .details-section {
            margin: ${isCompactItemsLayout ? '8px 0' : '12px 0'};
            padding-bottom: ${isCompactItemsLayout ? '6px' : '10px'};
            border-bottom: 1px solid var(--theme-primary);
          }
          .detail-row {
            display: flex;
            margin: ${isCompactItemsLayout ? '2px 0' : '3px 0'};
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
          }
          .detail-label {
            font-weight: bold;
            width: ${isCompactItemsLayout ? '128px' : '145px'};
            min-width: ${isCompactItemsLayout ? '128px' : '145px'};
            white-space: nowrap;
            word-break: keep-all;
            color: var(--theme-primary);
          }
          .detail-value {
            flex: 1;
            word-wrap: break-word;
            overflow-wrap: anywhere;
          }
          .items-section {
            margin: ${isCompactItemsLayout ? '8px 0' : '15px 0'};
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: ${isCompactItemsLayout ? '1px 0' : '4px 0'};
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
            padding: ${isCompactItemsLayout ? '1px 0' : '2px 0'};
            border-bottom: 1px solid #e0e0e0;
          }
          .item-description {
            flex: 1;
            padding-right: ${isCompactItemsLayout ? '12px' : '20px'};
            white-space: ${isCompactItemsLayout ? 'nowrap' : 'normal'};
            overflow: ${isCompactItemsLayout ? 'hidden' : 'visible'};
            text-overflow: ${isCompactItemsLayout ? 'ellipsis' : 'clip'};
          }
          .item-amount {
            text-align: right;
            min-width: ${isCompactItemsLayout ? '92px' : '100px'};
            padding-right: 5px;
            font-weight: normal;
          }
          .item-row.subtotal {
            border-top: 1px solid var(--theme-primary);
            border-bottom: none;
            margin-top: ${isCompactItemsLayout ? '6px' : '10px'};
            padding-top: ${isCompactItemsLayout ? '6px' : '8px'};
            font-weight: normal;
          }
          .item-row.total {
            border-top: 2px solid var(--theme-primary);
            border-bottom: none;
            margin-top: ${isCompactItemsLayout ? '5px' : '8px'};
            padding-top: ${isCompactItemsLayout ? '6px' : '10px'};
            padding-bottom: ${isCompactItemsLayout ? '3px' : '5px'};
            font-weight: bold;
            font-size: ${isCompactItemsLayout ? '10pt' : '11pt'};
            color: var(--theme-primary);
          }
          .signature-section {
            margin-top: ${isCompactItemsLayout ? '24px' : '40px'};
            text-align: left;
          }
          .signature-space {
            border-top: 1px solid var(--theme-primary);
            width: 200px;
            margin: ${isCompactItemsLayout ? '35px 0 5px 0' : '50px 0 5px 0'};
            height: 2px;
          }
          .signature-label {
            font-size: ${isCompactItemsLayout ? '9pt' : '10pt'};
            font-weight: bold;
            margin-top: 5px;
            color: var(--theme-primary);
          }
          .footer {
            margin-top: auto;
            padding-top: ${isCompactItemsLayout ? '10px' : '16px'};
            padding-bottom: 6px;
            border-top: 1px solid var(--theme-primary);
            background: ${isColorMode ? 'linear-gradient(180deg, #ffffff 0%, var(--theme-soft) 100%)' : '#ffffff'};
            text-align: center;
            font-size: ${isCompactItemsLayout ? '7.5pt' : '8pt'};
            line-height: ${isCompactItemsLayout ? '1.2' : '1.3'};
            color: var(--theme-accent);
          }
          .footer-line {
            margin: 2px 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            html, body, .invoice-page, .page-header, .footer {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              forced-color-adjust: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-page">
        <div class="page-header">
          <div class="logo">
            <img src="${invoiceLogoUrl}" alt="SS Cargo Logo" />
          </div>
          <div class="company-header">
            <div class="company-name">SUPER SHINE CARGO SERVICES</div>
            <div class="company-tagline">Freight Forwarding / Clearing & Transporters</div>
            <div class="company-tagline">Sea freight / Air Freight</div>
          </div>
          <div class="invoice-header-right">
            ${billDate}<br>
            <strong>INV No: ${invoiceNumber}</strong>
          </div>
        </div>

        <div class="recipient">
          <div class="recipient-line">The Director,</div>
          <div class="recipient-line"><strong>${customer.name}</strong></div>
          ${customer && (customer.addressNumber || customer.addressStreet1 || customer.addressCity) ? 
            `<div class="recipient-line">${customer.addressNumber || ''}, ${customer.addressStreet1 || ''}, ${customer.addressStreet2 ? customer.addressStreet2 + ', ' : ''}${customer.addressDistrict || ''}, ${customer.addressCity || ''}, ${customer.addressCountry || 'Sri Lanka'}</div>` 
            : ''}
        </div>

        <div class="details-section">
          <div class="detail-row">
            <div class="detail-label">Cusdec No</div>
            <div class="detail-value">: ${job.cusdecNumber || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Exporter</div>
            <div class="detail-value">: ${job.exporter || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">LC No</div>
            <div class="detail-value">: ${job.lcNumber || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Container No</div>
            <div class="detail-value">: ${job.containerNumber || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Shipment Category</div>
            <div class="detail-value">: ${job.shipmentCategory || '-'}</div>
          </div>
          ${isVehicleShipmentCategory(job.shipmentCategory) ? `
          <div class="detail-row">
            <div class="detail-label">Chassis No</div>
            <div class="detail-value">: ${job.chassisNumber || '-'}</div>
          </div>
          ` : ''}
        </div>

        <div class="items-section">
          ${payItemsArray && Array.isArray(payItemsArray) && payItemsArray.length > 0 ? 
            payItemsArray.map(item => {
              const description = item.description || item.name || 'Service Charge';
              const amount = item.billingAmount || item.amount || 0;
              return `
                <div class="item-row">
                  <div class="item-description">${description}</div>
                  <div class="item-amount">${formatAmount(amount)}</div>
                </div>
              `;
            }).join('') : 
            `<div class="item-row">
              <div class="item-description">Service Charges</div>
              <div class="item-amount">${formatAmount(grossTotal)}</div>
            </div>`
          }
          
          <div class="item-row subtotal">
            <div class="item-description">GROSS TOTAL</div>
            <div class="item-amount">${formatAmount(grossTotal)}</div>
          </div>
          
          ${advancePayment > 0 ? `
            <div class="item-row subtotal">
              <div class="item-description">${advancePaymentLabel}</div>
              <div class="item-amount">${formatAmount(advancePayment)}</div>
            </div>
          ` : ''}
          
          <div class="item-row total">
            <div class="item-description">Total Due Amount</div>
            <div class="item-amount">${formatAmount(advancePayment > 0 ? netTotal : grossTotal)}</div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-space"></div>
          <div class="signature-label">SUPER SHINE CARGO SERVICES<br>MANAGER</div>
        </div>

        <div class="footer">
          <div class="footer-line">No. 10/A, Ground Floor, Y.M.B.A Building Colombo 01, Sri Lanka. Office: 0112-433-581</div>
          <div class="footer-line">WhatsApp: +94754-946-946, +1410-868-9329 Hotline: +94-777-898929 E-mail: Supershinecargo@gmail.com</div>
        </div>
        </div>
      </body>
      </html>
    `;
  };

  if (user?.role === 'Waff Clerk') {
    return (
      <div className="billing-page">
        <div className="alert alert-error">Access Denied: Admin or Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1>Invoicing Management</h1>
        <p>Generate invoices and track profitability</p>
      </div>

      {message && <div className={`alert ${message.includes('Error') || message.includes('Cannot') || message.includes('⚠️') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Generate New Invoice</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Select Job *</label>
            <select 
              value={selectedJob?.jobId || ''} 
              onChange={(e) => handleJobSelect(e.target.value)}
              className="form-control"
              disabled={loadingSettlement}
            >
              <option value="">-- Select a Job --</option>
              {jobs.map(job => (
                <option key={job.jobId} value={job.jobId}>
                  {job.jobId} - {getCustomerName(job.customerId)} - {job.shipmentCategory}
                </option>
              ))}
            </select>
            {loadingSettlement && (
              <div style={{ marginTop: '10px', color: '#101036', fontStyle: 'italic' }}>
                Loading petty cash settlement data...
              </div>
            )}
          </div>

          {selectedJob && (
            <div className="job-details-section">
              <div className="job-info-card">
                <h3>Job Information</h3>
                {(() => {
                  const chassisMissing = !selectedJob.chassisNumber || selectedJob.chassisNumber.trim() === '';
                  const chassisRequired = isVehicleShipmentCategory(selectedJob.shipmentCategory);
                  return (
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Job ID:</span>
                    <span className="info-value">{selectedJob.jobId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Customer:</span>
                    <span className="info-value">{getCustomerName(selectedJob.customerId)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">
                      <span className="category-badge">{selectedJob.shipmentCategory}</span>
                    </span>
                  </div>
                  {chassisRequired && (
                    <div className="info-row">
                      <span className="info-label">
                        Chassis Number: {chassisRequired && chassisMissing && <span className="required-indicator">*Required</span>}
                      </span>
                      <span className={`info-value ${chassisRequired && chassisMissing ? 'missing-value' : ''}`}>
                        {selectedJob.chassisNumber || '-'}
                      </span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">BL Number: {(!selectedJob.blNumber || selectedJob.blNumber.trim() === '') && <span className="required-indicator">*Required</span>}</span>
                    <span className={`info-value ${(!selectedJob.blNumber || selectedJob.blNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.blNumber || '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">CUSDEC Number: {(!selectedJob.cusdecNumber || selectedJob.cusdecNumber.trim() === '') && <span className="required-indicator">*Required</span>}</span>
                    <span className={`info-value ${(!selectedJob.cusdecNumber || selectedJob.cusdecNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.cusdecNumber || '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Exporter:</span>
                    <span className="info-value">{selectedJob.exporter || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">LC Number: {(!selectedJob.lcNumber || selectedJob.lcNumber.trim() === '') && <span className="required-indicator">*Required</span>}</span>
                    <span className={`info-value ${(!selectedJob.lcNumber || selectedJob.lcNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.lcNumber || '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Container Number: {(!selectedJob.containerNumber || selectedJob.containerNumber.trim() === '') && <span className="required-indicator">*Required</span>}</span>
                    <span className={`info-value ${(!selectedJob.containerNumber || selectedJob.containerNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.containerNumber || '-'}
                    </span>
                  </div>
                  {selectedJob.hasOwnProperty('transporter') && (
                    <div className="info-row">
                      <span className="info-label">Transporter:</span>
                      <span className="info-value">
                        {selectedJob.transporter || '-'}
                      </span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="info-value">
                      <span className={`status-badge status-${(selectedJob.status || 'Open').toLowerCase()}`}>
                        {selectedJob.status}
                      </span>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Advance Payment:</span>
                    <span className={`info-value ${selectedJob.advancePayment > 0 ? 'advance-received' : 'no-advance'}`}>
                      LKR {formatAmount(selectedJob.advancePayment || 0)}
                      {selectedJob.advancePayment > 0 && (
                        <span className="advance-indicator"> ✓ Received</span>
                      )}
                    </span>
                  </div>
                </div>
                  );
                })()}
              </div>

              <div className="pay-items-card">
                <div className="card-header-inline">
                  <h3>Pay Items</h3>
                  {!showPayItemsRow && selectedJob.payItems && selectedJob.payItems.length > 0 && (
                    <button 
                      onClick={() => setShowPayItemsRow(true)} 
                      className="btn btn-primary btn-small"
                    >
                      + Add More Items
                    </button>
                  )}
                  {!showPayItemsRow && (!selectedJob.payItems || selectedJob.payItems.length === 0) && (
                    <button 
                      onClick={() => setShowPayItemsRow(true)} 
                      className="btn btn-primary btn-small"
                    >
                      + Add Items
                    </button>
                  )}
                </div>

                {showPayItemsRow && (
                  <div className="pay-items-form">
                    {selectedJob.payItems && selectedJob.payItems.length > 0 && (
                      <div className="add-more-items-notice">
                        <div className="notice-icon">ℹ️</div>
                        <div className="notice-text">
                          <strong>Adding Additional Items</strong>
                          <p>You are adding new pay items to the existing {selectedJob.payItems.length} item(s). All items will be combined in the review table.</p>
                        </div>
                      </div>
                    )}
                    <table className="pay-items-input-table">
                      <thead>
                        <tr>
                          <th>Pay Item Name</th>
                          <th>Actual Cost (LKR)</th>
                          <th>Paid By</th>
                          <th>Billing Amount (LKR)</th>
                          <th>Same Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payItems.map((item, index) => (
                          <tr key={index} className={item.isOfficePayItem ? 'office-pay-item-row' : item.isPettyCashItem ? 'petty-cash-item-row' : ''}>
                            <td>
                              <div className="pay-item-name-container">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handlePayItemChange(index, 'name', e.target.value)}
                                  placeholder="e.g., SLPA Bill, Transport"
                                  className="form-control-small"
                                  disabled={item.paidByName}
                                />
                                {item.isOfficePayItem && (
                                  <span className="source-badge office-badge">Office Payment</span>
                                )}
                                {item.isPettyCashItem && (
                                  <span className="source-badge petty-cash-badge">Petty Cash</span>
                                )}
                              </div>
                            </td>
                            <td data-label="Actual Cost (LKR)">
                              <input
                                type="number"
                                step="0.01"
                                value={item.actualCost}
                                onChange={(e) => handlePayItemChange(index, 'actualCost', e.target.value)}
                                placeholder="0.00"
                                className="form-control-small"
                                disabled={item.paidByName}
                              />
                            </td>
                            <td data-label="Paid By">
                              {item.paidByName ? (
                                <span className="paid-by-name">{item.paidByName}</span>
                              ) : (
                                <span className="paid-by-empty">-</span>
                              )}
                            </td>
                            <td data-label="Billing Amount (LKR)">
                              <input
                                type="number"
                                step="0.01"
                                value={item.billingAmount}
                                onChange={(e) => handlePayItemChange(index, 'billingAmount', e.target.value)}
                                placeholder="0.00"
                                className="form-control-small"
                                disabled={item.sameAmount}
                              />
                            </td>
                            <td data-label="Same Amount" className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={item.sameAmount}
                                onChange={(e) => handlePayItemChange(index, 'sameAmount', e.target.checked)}
                              />
                            </td>
                            <td>
                              {payItems.length > 1 && !item.paidByName && (
                                <button
                                  type="button"
                                  onClick={() => removePayItemRow(index)}
                                  className="btn btn-danger btn-small"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pay-items-actions">
                      <button onClick={addPayItemRow} className="btn btn-secondary btn-small">
                        + Add Another Item
                      </button>
                      <div className="action-buttons-right">
                        <button onClick={savePayItems} className="btn btn-success">
                          Save Pay Items
                        </button>
                        <button 
                          onClick={() => {
                            setShowPayItemsRow(false);
                            setPayItems([{ name: '', actualCost: '', billingAmount: '', sameAmount: false }]);
                          }} 
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob.payItems && selectedJob.payItems.length > 0 && (
                  <div className="saved-pay-items">
                    <div className="pay-items-review-header">
                      <h4>📋 Pay Items Review</h4>
                      <p className="review-subtitle">Review all pay items before generating invoice</p>
                      {user?.role === 'Manager' && (
                        <div className="manager-notice">
                          <div className="notice-icon">💼</div>
                          <div className="notice-text">
                            <strong>Manager Access:</strong> To modify billing amounts or remove pay items, please contact a Super Admin or Admin for assistance.
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`pay-items-review-table ${!canEditPayItems() ? 'no-actions' : ''}`}>
                      <div className="table-header">
                        <div className="header-cell description-header">Description</div>
                        <div className="header-cell amount-header">Actual Cost (LKR)</div>
                        <div className="header-cell amount-header">Billing Amount (LKR)</div>
                        {canEditPayItems() && (
                          <div className="header-cell actions-header">Actions</div>
                        )}
                      </div>
                      <div className="table-body">
                        {selectedJob.payItems.map((item, idx) => (
                          <div key={idx} className="table-row">
                            <div className="table-cell description-cell">{item.description}</div>
                            <div className="table-cell amount-cell">{formatAmount(parseFloat(item.actualCost) || parseFloat(item.amount) || 0)}</div>
                            <div className="table-cell amount-cell">{formatAmount(parseFloat(item.billingAmount) || parseFloat(item.amount) || 0)}</div>
                            {canEditPayItems() && (
                              <div className="table-cell actions-cell">
                                <button
                                  className="action-btn edit-btn"
                                  onClick={() => openEditModal(item, idx)}
                                  title="Edit billing amount"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="action-btn remove-btn"
                                  onClick={() => removePayItem(idx)}
                                  title="Remove pay item"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="table-row total-row">
                          <div className="table-cell description-cell total-label"><strong>Total</strong></div>
                          <div className="table-cell amount-cell total-amount"><strong>{formatAmount(calculateTotals().actualCost)}</strong></div>
                          <div className="table-cell amount-cell total-amount"><strong>{formatAmount(calculateTotals().billingAmount)}</strong></div>
                          {canEditPayItems() && (
                            <div className="table-cell actions-cell"></div>
                          )}
                        </div>
                        <div className="table-row profit-row">
                          <div className="table-cell description-cell profit-label"><strong>Profit Margin</strong></div>
                          <div className="table-cell amount-cell"></div>
                          <div className="table-cell amount-cell profit-amount">
                            <strong className={calculateTotals().profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                              {formatAmount(calculateTotals().profit)}
                            </strong>
                          </div>
                          {canEditPayItems() && (
                            <div className="table-cell actions-cell"></div>
                          )}
                        </div>
                        {/* Advance Payment Summary */}
                        <div className="table-row advance-summary-row">
                          <div className="table-cell description-cell advance-summary-label"><strong>Invoice Summary</strong></div>
                          <div className="table-cell amount-cell"></div>
                          <div className="table-cell amount-cell"></div>
                          {canEditPayItems() && (
                            <div className="table-cell actions-cell"></div>
                          )}
                        </div>
                        <div className="table-row gross-total-row">
                          <div className="table-cell description-cell gross-total-label">Gross Total</div>
                          <div className="table-cell amount-cell"></div>
                          <div className="table-cell amount-cell gross-total-amount">
                            <strong>{formatAmount(calculateTotals().grossTotal)}</strong>
                          </div>
                          {canEditPayItems() && (
                            <div className="table-cell actions-cell"></div>
                          )}
                        </div>
                        {selectedJob.advancePayment > 0 && (
                          <div className="table-row advance-payment-row">
                            <div className="table-cell description-cell advance-payment-label">Less: Advance Payment</div>
                            <div className="table-cell amount-cell"></div>
                            <div className="table-cell amount-cell advance-payment-amount">
                              <strong className="advance-deduction">({formatAmount(calculateTotals().advancePayment)})</strong>
                            </div>
                            {canEditPayItems() && (
                              <div className="table-cell actions-cell"></div>
                            )}
                          </div>
                        )}
                        <div className="table-row net-total-row">
                          <div className="table-cell description-cell net-total-label"><strong>Net Total (Customer Payable)</strong></div>
                          <div className="table-cell amount-cell"></div>
                          <div className="table-cell amount-cell net-total-amount">
                            <strong className="final-amount">{formatAmount(calculateTotals().netTotal)}</strong>
                          </div>
                          {canEditPayItems() && (
                            <div className="table-cell actions-cell"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="generate-bill-section">
                      <button onClick={generateBill} className="btn btn-success btn-large">
                        ✓ Generate Invoice
                      </button>
                      
                      {/* Validation Modal */}
                      {showValidationModal && (
                        <div className="validation-modal-overlay" onClick={() => setShowValidationModal(false)}>
                          <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="validation-modal-header">
                              <h3>⚠️ Cannot Generate Invoice</h3>
                              <button className="modal-close-btn" onClick={() => setShowValidationModal(false)}>×</button>
                            </div>
                            <div className="validation-modal-body">
                              <p style={{ whiteSpace: 'pre-line' }}>{validationMessage}</p>
                            </div>
                            <div className="validation-modal-footer">
                              <button onClick={() => setShowValidationModal(false)} className="btn btn-primary">
                                OK, I'll Update the Job
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(!selectedJob.payItems || selectedJob.payItems.length === 0) && !showPayItemsRow && (
                  <p className="no-items">No pay items added yet. Click "Add Items" to start.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Generated Invoices ({bills.length})</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 600 }}>Print Mode</span>
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value)}
              className="form-control"
              style={{ minWidth: '180px', padding: '6px 10px' }}
            >
              <option value="color">Color (Theme)</option>
              <option value="bw">Black & White</option>
            </select>
          </div>
        </div>
        {bills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>No invoices generated yet</p>
          </div>
        ) : (
          <div className="billing-table-wrapper">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Job ID</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="expand-header"></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <React.Fragment key={bill.billId}>
                    <tr className={bill.isOverdue ? 'overdue-row' : ''}>
                      <td data-label="Invoice No"><strong>{bill.invoiceNumber || bill.billId}</strong></td>
                      <td data-label="Job ID">{bill.jobId}</td>
                      <td data-label="Customer">{getCustomerName(bill.customerId)}</td>
                      <td data-label="Invoice Date">
                        {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString() : '-'}
                      </td>
                      <td data-label="Due Date">
                        {bill.dueDate ? (
                          <div className="due-date-cell">
                            {new Date(bill.dueDate).toLocaleDateString()}
                            {bill.isOverdue && <span className="overdue-badge">OVERDUE</span>}
                          </div>
                        ) : '-'}
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge status-${bill.paymentStatus.toLowerCase()}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="expand-column">
                        <button
                          className="expand-btn-middle"
                          onClick={() => setExpandedBillId(expandedBillId === bill.billId ? null : bill.billId)}
                          title={expandedBillId === bill.billId ? "Hide details" : "View details"}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points={expandedBillId === bill.billId ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                          </svg>
                        </button>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button 
                            onClick={() => printBill(bill)} 
                            className="btn btn-primary btn-small"
                            title="Print Invoice"
                          >
                            Print
                          </button>
                          {bill.paymentStatus === 'Unpaid' && (
                            <button 
                              onClick={() => markAsPaid(bill.billId)} 
                              className="btn btn-success btn-small"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBillId === bill.billId && (
                      <tr className="details-row">
                        <td colSpan="8">
                          <div className="bill-details-expanded">
                            <div className="details-grid">
                              <div className="detail-card">
                                <div className="detail-label">Actual Cost</div>
                                <div className="detail-value">LKR {formatAmount(bill.actualCost)}</div>
                              </div>
                              <div className="detail-card">
                                <div className="detail-label">Billing Amount</div>
                                <div className="detail-value">LKR {formatAmount(bill.billingAmount)}</div>
                              </div>
                              <div className="detail-card">
                                <div className="detail-label">Profit</div>
                                <div className={`detail-value ${bill.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                  LKR {formatAmount(bill.profit)}
                                </div>
                              </div>
                              <div className="detail-card">
                                <div className="detail-label">Total Due</div>
                                <div className="detail-value total-due"><strong>LKR {formatAmount(bill.total)}</strong></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Pay Item Modal */}
      {showEditModal && editingPayItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Pay Item</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="edit-pay-item-info">
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{editingPayItem.description}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Actual Cost:</span>
                  <span className="info-value">LKR {formatAmount(editingPayItem.actualCost || editingPayItem.amount || 0)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Current Billing Amount:</span>
                  <span className="info-value">LKR {formatAmount(editingPayItem.billingAmount || editingPayItem.amount || 0)}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label>New Billing Amount (LKR) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editBillingAmount}
                  onChange={(e) => setEditBillingAmount(e.target.value)}
                  placeholder="Enter new billing amount"
                  className="form-control"
                />
                <p className="helper-text">
                  💡 You can only modify the billing amount. The actual cost remains unchanged for accounting purposes.
                </p>
              </div>
              
              <div className="enterprise-notice">
                <div className="notice-icon">🏢</div>
                <div className="notice-content">
                  <strong>Enterprise Policy:</strong>
                  <p>Only Super Admin and Admin users can modify billing amounts. This ensures proper financial controls and audit trails in enterprise operations.</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={saveEditedPayItem} 
                className="btn btn-primary"
                disabled={!editBillingAmount || parseFloat(editBillingAmount) < 0}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;

