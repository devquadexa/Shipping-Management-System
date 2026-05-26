import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingService } from '../api/services/billingService';
import { jobService } from '../api/services/jobService';
import { customerService } from '../api/services/customerService';
import { transporterService } from '../api/services/transporterService';
import { invoiceReviewService } from '../api/services/invoiceReviewService';
import API_BASE from '../api/config';
import apiClient from '../api/client';
import Pagination from './Pagination';
import ReviewInvoiceModal from './ReviewInvoiceModal';
import { formatDate, formatDateWithMonth, formatDateWithFullMonth } from '../utils/dateFormatter';
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

  const getTransporterCostItem = () => {
    // Always build transporter cost description with place names
    const fromPlace = selectedJob?.exporter || 'placename';
    const toPlace = selectedJob?.exporter || 'placename';
    const description = `transporter cost (from ${fromPlace} to ${toPlace})`;
    
    return {
      name: description,
      actualCost: '',
      billingAmount: '',
      sameAmount: false,
      hasBill: false
    };
  };

  // Transform pay item description to add prefix if it's a transporter cost
  const getDisplayDescription = (item, job = selectedJob) => {
    const description = item.description || item.name || '';
    const normalized = description.toLowerCase().trim();
    
    // If it's the old format transporter cost, add the prefix
    if (normalized === 'transporter cost' && job) {
      const fromPlace = job.exporter || 'placename';
      const toPlace = job.transporter || 'placename';
      return `transporter cost (from ${fromPlace} to ${toPlace})`;
    }
    
    return description;
  };

  const getBlankPayItem = () => ({
    name: '',
    actualCost: '',
    billingAmount: '',
    sameAmount: false,
    hasBill: false
  });

  const hasTransporterCostItem = (items) => {
    return Array.isArray(items) && items.some(item => {
      const label = (item?.name || item?.description || '').toLowerCase().trim();
      // Only check for new format with place names
      return label.startsWith('transporter cost (from');
    });
  };

  const isTransporterCostLabel = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    // Only check for new format with place names
    return normalized.startsWith('transporter cost (from');
  };

  const mergeTransporterCostItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const merged = [];
    let transporterAccumulator = null;

    items.forEach((item) => {
      const description = item.description || item.name || '';
      if (!isTransporterCostLabel(description)) {
        merged.push(item);
        return;
      }

      if (!transporterAccumulator) {
        transporterAccumulator = {
          ...item,
          description: description, // Keep the full description with place names
          amount: parseFloat(item.amount || item.actualCost || 0) || 0,
          actualCost: parseFloat(item.actualCost || item.amount || 0) || 0,
          billingAmount: parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0
        };
        return;
      }

      transporterAccumulator.amount += parseFloat(item.amount || item.actualCost || 0) || 0;
      transporterAccumulator.actualCost += parseFloat(item.actualCost || item.amount || 0) || 0;
      transporterAccumulator.billingAmount += parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0;
    });

    if (transporterAccumulator) {
      merged.push(transporterAccumulator);
    }

    return merged;
  };

  const ensureFclTransporterCost = (items, shipmentCategory) => {
    const normalizedItems = Array.isArray(items) ? [...items] : [];
    if (shipmentCategory !== 'FCL') return normalizedItems;

    const fclItems = normalizedItems.filter(item => {
      const label = (item?.name || item?.description || '').trim();
      const hasAmount = item?.actualCost || item?.billingAmount || item?.amount;
      return Boolean(label || hasAmount);
    });

    if (!hasTransporterCostItem(fclItems)) {
      fclItems.push(getTransporterCostItem());
    }

    return fclItems;
  };

  const getDefaultPayItemsForCategory = (shipmentCategory) => {
    return ensureFclTransporterCost([], shipmentCategory);
  };

  const getAssignedClerks = () => {
    if (!selectedJob || !selectedJob.assignedUsers) {
      return [];
    }
    return selectedJob.assignedUsers;
  };

  const formatCusdecNumberForDisplay = (value) => {
    const rawValue = (value || '').trim();
    if (!rawValue) return '';

    const cleaned = rawValue.replace(/^i\s*-\s*/i, '').trim();
    return cleaned ? `I-${cleaned}` : '';
  };

  const formatCusdecWithDate = (cusdecNumber, cusdecDate) => {
    const formattedNumber = formatCusdecNumberForDisplay(cusdecNumber);
    if (!formattedNumber) return '-';

    const formattedDate = formatDate(cusdecDate);
    return formattedDate ? `${formattedNumber} of ${formattedDate}` : formattedNumber;
  };

  const [bills, setBills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [message, setMessage] = useState('');
  const [showPayItemsRow, setShowPayItemsRow] = useState(false);
  const [payItems, setPayItems] = useState([]);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [printMode, setPrintMode] = useState('color');
  
  // New states for pay item editing
  const [editingPayItemIndex, setEditingPayItemIndex] = useState(null);
  const [editingBillingAmount, setEditingBillingAmount] = useState('');
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeAmount, setChequeAmount] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank');
  const [chequeAutoFilled, setChequeAutoFilled] = useState(false);
  const [chequeAutoFillData, setChequeAutoFillData] = useState(null);
  const [chequeType, setChequeType] = useState('new'); // 'new' | 'existing'
  const [existingCheques, setExistingCheques] = useState([]);
  const [loadingExistingCheques, setLoadingExistingCheques] = useState(false);
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'partial'
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [showGeneratedInvoices, setShowGeneratedInvoices] = useState(true);
  const [showOldInvoices, setShowOldInvoices] = useState(false);
  
  // Old Invoices states
  const [oldInvoices, setOldInvoices] = useState([]);
  const [showOldInvoiceModal, setShowOldInvoiceModal] = useState(false);
  const [showOldPaymentModal, setShowOldPaymentModal] = useState(false);
  const [editingOldInvoice, setEditingOldInvoice] = useState(null);
  const [selectedOldInvoice, setSelectedOldInvoice] = useState(null);
  const [expandedOldInvoiceRow, setExpandedOldInvoiceRow] = useState(null);
  const [oldInvoiceFormData, setOldInvoiceFormData] = useState({
    customerId: '',
    cusdecNumber: '',
    cusdecDate: '',
    invoiceDate: '',
    invoiceNumberSuffix: '',
    totalAmount: '',
    settleDate: ''
  });
  const [oldInvoicePaymentData, setOldInvoicePaymentData] = useState({
    paymentAmount: '',
    paymentMethod: 'Cash',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
    chequeNumber: '',
    chequeDate: '',
    chequeAmount: '',
    bankName: ''
  });
  const [oldInvoiceFormErrors, setOldInvoiceFormErrors] = useState({});
  const [oldInvoiceSearchTerm, setOldInvoiceSearchTerm] = useState('');
  const [oldInvoiceFilterStatus, setOldInvoiceFilterStatus] = useState('All');
  
  // Review Invoice states
  const [showReviewInvoiceModal, setShowReviewInvoiceModal] = useState(false);
  const [reviewInvoiceLoading, setReviewInvoiceLoading] = useState(false);

  useEffect(() => {
    fetchBills();
    fetchJobs();
    fetchCustomers();
    fetchTransporters();
    fetchOldInvoices();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await billingService.getBills();
      
      // Fetch payment records for each bill
      const billsWithPayments = await Promise.all(
        data.map(async (bill) => {
          try {
            const paymentRecords = await apiClient.get(`/payments/bill/${bill.billId}`);
            // Ensure paymentRecords is always an array
            const records = Array.isArray(paymentRecords.data) ? paymentRecords.data : [];
            return {
              ...bill,
              paymentRecords: records
            };
          } catch (error) {
            console.warn(`Could not fetch payment records for bill ${bill.billId}:`, error);
            // Always return an empty array, never undefined or null
            return {
              ...bill,
              paymentRecords: []
            };
          }
        })
      );
      
      setBills(billsWithPayments);
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

  const fetchTransporters = async () => {
    try {
      const data = await transporterService.getAll();
      setTransporters(data);
    } catch (error) {
      console.error('Error fetching transporters:', error);
    }
  };

  const fetchOldInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/old-invoices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch old invoices');
      }
      
      const data = await response.json();
      setOldInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching old invoices:', error);
      setOldInvoices([]);
    }
  };

  const handleTransporterChange = async (newTransporterId) => {
    if (!selectedJob) return;

    try {
      const transporter = transporters.find(t => t.transporterId === newTransporterId);
      const transporterName = transporter ? transporter.name : '';

      // Update job with new transporter
      await jobService.update(selectedJob.jobId, {
        transporter: transporterName
      });

      // Update selected job state
      setSelectedJob({
        ...selectedJob,
        transporter: transporterName
      });

      setMessage('Transporter updated successfully!');
      setTimeout(() => setMessage(''), 3000);

      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Error updating transporter:', error);
      setMessage('Error updating transporter');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleJobSelect = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      setPayItems([]);
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
              hasBill: item.hasBill || false,
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
                      hasBill: item.hasBill === true || item.hasBill === 1,
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
      const hasExistingPayItems = job.payItems && job.payItems.length > 0;

      if (hasExistingPayItems) {
        // Job has saved pay items — merge any office pay items not already saved
        let mergedPayItems = [...job.payItems];
        const officeItemsFromApi = allPayItems.filter(item => item.isOfficePayItem);
        officeItemsFromApi.forEach(opi => {
          const alreadySaved = mergedPayItems.some(
            p => p.source === 'Office Payment' && p.description === opi.name
          );
          if (!alreadySaved) {
            mergedPayItems.push({
              description: opi.name,
              amount: parseFloat(opi.actualCost),
              actualCost: parseFloat(opi.actualCost),
              billingAmount: parseFloat(opi.billingAmount || opi.actualCost || 0),
              paidBy: opi.paidByName || opi.paidBy || 'Office',
              source: 'Office Payment',
              officePayItemId: opi.officePayItemId
            });
          }
        });
        mergedPayItems = ensureFclTransporterCost(mergedPayItems, job.shipmentCategory);
        setSelectedJob({ ...job, payItems: mergedPayItems });
        setShowPayItemsRow(false);
        setMessage(`📋 Job has ${mergedPayItems.length} pay items. Use "+ Add More Items" to add additional items.`);
        setTimeout(() => setMessage(''), 5000);
      } else if (allPayItems.length > 0) {
        const payItemsWithFclItem = ensureFclTransporterCost(allPayItems, job.shipmentCategory);
        setPayItems(payItemsWithFclItem);
        setShowPayItemsRow(true);
        
        const officeItemsCount = allPayItems.filter(item => item.isOfficePayItem).length;
        const pettyCashItemsCount = allPayItems.filter(item => item.isPettyCashItem).length;
        let message = `✅ Loaded ${allPayItems.length} items: `;
        if (officeItemsCount > 0) message += `${officeItemsCount} office payments`;
        if (pettyCashItemsCount > 0) {
          if (officeItemsCount > 0) message += `, `;
          message += `${pettyCashItemsCount} petty cash items`;
        }
        message += '. Please review billing amounts.';
        setMessage(message);
        setTimeout(() => setMessage(''), 5000);
      } else {
        // No existing pay items, no office/petty cash items — show entry form or load templates
        if (job?.pettyCashStatus !== 'Settled') {
          setMessage('Petty cash must be settled before generating invoice');
          setTimeout(() => setMessage(''), 3000);
        } else {
          loadPayItemTemplates(job);
          return;
        }
        const defaultPayItems = getDefaultPayItemsForCategory(job?.shipmentCategory);
        setPayItems(defaultPayItems);
        setShowPayItemsRow(defaultPayItems.length > 0);
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
              sameAmount: false,
              hasBill: false
            }));

            const payItemsWithFclItem = ensureFclTransporterCost(loadedPayItems, job.shipmentCategory);
            
            setPayItems(payItemsWithFclItem);
            setShowPayItemsRow(true);
            setMessage(`Loaded ${payItemsWithFclItem.length} default pay items for ${job.shipmentCategory}`);
            setTimeout(() => setMessage(''), 3000);
          } else {
            const defaultPayItems = getDefaultPayItemsForCategory(job.shipmentCategory);
            setPayItems(defaultPayItems);
            setShowPayItemsRow(defaultPayItems.length > 0);
          }
        } else {
          const defaultPayItems = getDefaultPayItemsForCategory(job.shipmentCategory);
          setPayItems(defaultPayItems);
          setShowPayItemsRow(defaultPayItems.length > 0);
        }
      } catch (error) {
        console.error('Error loading pay item templates:', error);
        const defaultPayItems = getDefaultPayItemsForCategory(job.shipmentCategory);
        setPayItems(defaultPayItems);
        setShowPayItemsRow(defaultPayItems.length > 0);
      }
    } else {
      setPayItems(getDefaultPayItemsForCategory(job?.shipmentCategory));
    }
  };

  const addPayItemRow = () => {
    setPayItems([...payItems, getBlankPayItem()]);
  };

  const openPayItemsEditor = () => {
    setShowPayItemsRow(true);
    if (!Array.isArray(payItems) || payItems.length === 0) {
      setPayItems([getBlankPayItem()]);
    }
  };

  const addTransporterCostRow = () => {
    // Check if transporter cost already exists
    if (hasTransporterCostItem(payItems)) {
      setMessage('Transporter cost is already added. Use the existing row or remove it first.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setPayItems((prevPayItems) => [...prevPayItems, getTransporterCostItem()]);
    setShowPayItemsRow(true);
  };

  const addTransporterCostFromHeader = () => {
    // Check if transporter cost already exists
    if (hasTransporterCostItem(payItems)) {
      setMessage('Transporter cost is already added. Use the existing row or remove it first.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setShowPayItemsRow(true);
    setPayItems((prevPayItems) => [...prevPayItems, getTransporterCostItem()]);
  };

  const removePayItemRow = (index) => {
    const newPayItems = payItems.filter((_, i) => i !== index);
    setPayItems(newPayItems.length > 0 ? newPayItems : [getBlankPayItem()]);
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
                billingAmount: parseFloat(item.billingAmount),
                hasBill: item.hasBill || false
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

      const transporterCostCount = allPayItemsData.filter(item =>
        isTransporterCostLabel(item.description || item.name)
      ).length;

      let finalPayItemsData = allPayItemsData;
      if (transporterCostCount > 1) {
        const shouldMergeTransporterCost = window.confirm(
          'Transporter cost is already added.\n\nPress OK to merge with the existing transporter cost amount.\nPress Cancel to keep it as a separate line item.'
        );

        if (shouldMergeTransporterCost) {
          finalPayItemsData = mergeTransporterCostItems(allPayItemsData);
        }
      }
      
      console.log('New pay items to add:', newPayItemsData);
      console.log('Combined pay items (existing + new):', allPayItemsData);
      console.log('Final pay items to save:', finalPayItemsData);
      
      // Save combined pay items to the job
      await jobService.replacePayItems(selectedJob.jobId, finalPayItemsData);
      console.log('✓ All pay items saved successfully');

      const isAddingToExisting = existingPayItems.length > 0;
      const addedCount = newPayItemsData.length;
      const totalCount = finalPayItemsData.length;
      
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
      
      if (updatedJob) {
        // Re-fetch office pay items and merge into the review table
        let mergedPayItems = [...(updatedJob.payItems || [])];
        try {
          const officeRes = await fetch(`${API_BASE}/api/office-pay-items/job/${selectedJob.jobId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (officeRes.ok) {
            const freshOfficeItems = await officeRes.json();
            // Add office pay items that are not already in the saved payItems
            freshOfficeItems.forEach(opi => {
              const alreadySaved = mergedPayItems.some(
                p => p.source === 'Office Payment' && p.description === opi.description
              );
              if (!alreadySaved) {
                mergedPayItems.push({
                  description: opi.description,
                  amount: parseFloat(opi.actualCost),
                  actualCost: parseFloat(opi.actualCost),
                  billingAmount: parseFloat(opi.billingAmount || opi.actualCost),
                  paidBy: opi.paidByName || opi.paidBy || 'Office',
                  source: 'Office Payment',
                  officePayItemId: opi.officePayItemId
                });
              }
            });
          }
        } catch (err) {
          console.error('Error re-fetching office pay items after save:', err);
        }
        setSelectedJob({ ...updatedJob, payItems: mergedPayItems });
        console.log('✓ Selected job updated with merged pay items:', mergedPayItems.length);
      } else {
        console.error('❌ Could not find updated job');
        setSelectedJob({
          ...selectedJob,
          payItems: allPayItemsData
        });
      }
      
      // Reset the pay items form
      setPayItems([]);
      
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

  // Calculate real-time totals from unsaved pay items (before saving)
  const calculateUnsavedTotals = () => {
    // For actual cost: include items that have a name and actual cost (regardless of billing amount)
    const itemsWithActualCost = payItems.filter(item => {
      return item.name && (item.actualCost || item.actualCost === 0 || item.actualCost === '0');
    });
    
    // For billing amount: include items that have a name and billing amount
    const itemsWithBillingAmount = payItems.filter(item => {
      return item.name && (item.billingAmount || item.billingAmount === 0 || item.billingAmount === '0');
    });
    
    // For profit calculation: only items with BOTH actual cost and billing amount
    const itemsWithBoth = payItems.filter(item => {
      return item.name && 
             (item.actualCost || item.actualCost === 0 || item.actualCost === '0') && 
             (item.billingAmount || item.billingAmount === 0 || item.billingAmount === '0');
    });
    
    const actualCost = itemsWithActualCost.reduce((sum, item) => {
      return sum + (parseFloat(item.actualCost) || 0);
    }, 0);
    
    const billingAmount = itemsWithBillingAmount.reduce((sum, item) => {
      return sum + (parseFloat(item.billingAmount) || 0);
    }, 0);
    
    const profit = billingAmount - actualCost;
    const profitMargin = actualCost > 0 ? ((profit / actualCost) * 100) : 0;
    
    return { 
      actualCost, 
      billingAmount, 
      profit, 
      profitMargin, 
      actualCostItemCount: itemsWithActualCost.length,
      billingAmountItemCount: itemsWithBillingAmount.length,
      profitItemCount: itemsWithBoth.length
    };
  };

  // Helper function to check if user can edit pay items
  const canEditPayItems = () => {
    return user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager';
  };

  // Start inline editing for a pay item
  const startEditingPayItem = (index) => {
    if (!canEditPayItems()) {
      setMessage('❌ Only Super Admin, Admin, and Manager users can edit pay items. Please contact an administrator for changes.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    const payItem = selectedJob.payItems[index];
    setEditingPayItemIndex(index);
    setEditingBillingAmount(payItem.billingAmount || payItem.amount || '');
  };

  // Cancel inline editing
  const cancelEditingPayItem = () => {
    setEditingPayItemIndex(null);
    setEditingBillingAmount('');
  };

  // Save inline edited pay item
  const saveInlineEditedPayItem = async () => {
    if (editingPayItemIndex === null) return;
    
    const newBillingAmount = parseFloat(editingBillingAmount);
    if (isNaN(newBillingAmount) || newBillingAmount < 0) {
      setMessage('❌ Please enter a valid billing amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      // Update the pay item in the selectedJob
      const updatedPayItems = [...selectedJob.payItems];
      updatedPayItems[editingPayItemIndex] = {
        ...updatedPayItems[editingPayItemIndex],
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
      setEditingPayItemIndex(null);
      setEditingBillingAmount('');
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
      setMessage('❌ Only Super Admin, Admin, and Manager users can remove pay items. Please contact an administrator for changes.');
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
      missingFields.push('TT / LC / DA / DP / NFE Number');
    }
    // Container Number is only required for non-vehicle shipments
    if (
      !isVehicleShipmentCategory(selectedJob.shipmentCategory) &&
      (!selectedJob.containerNumber || (typeof selectedJob.containerNumber === 'string' && selectedJob.containerNumber.trim() === ''))
    ) {
      missingFields.push('Container Number');
    }
    if (
      isVehicleShipmentCategory(selectedJob.shipmentCategory) &&
      (!selectedJob.chassisNumber || (typeof selectedJob.chassisNumber === 'string' && selectedJob.chassisNumber.trim() === ''))
    ) {
      missingFields.push('Chassis Number');
    }
    
    // Transporter and Transport Delivery Date are required only for FCL jobs
    const isFclJob = selectedJob.shipmentCategory === 'FCL';
    if (isFclJob) {
      if (!selectedJob.transporter || (typeof selectedJob.transporter === 'string' && selectedJob.transporter.trim() === '')) {
        missingFields.push('Transporter');
      }
      if (!selectedJob.transportDeliveryDate || (typeof selectedJob.transportDeliveryDate === 'string' && selectedJob.transportDeliveryDate.trim() === '')) {
        missingFields.push('Transport Delivery Date');
      }
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
      
      // Update petty cash assignment status to Closed via direct API call (safety net)
      try {
        const assignmentsRes = await fetch(`${API_BASE}/api/petty-cash-assignments/job/${selectedJob.jobId}/all`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (assignmentsRes.ok) {
          const jobAssignments = await assignmentsRes.json();
          for (const a of jobAssignments) {
            await fetch(`${API_BASE}/api/petty-cash-assignments/${a.assignmentId}/close`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
          }
        }
      } catch (err) {
        console.warn('Could not close petty cash assignments from frontend:', err.message);
      }

      const customerName = customers.find(c => c.customerId === selectedJob.customerId)?.name || selectedJob.customerId;
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

  const handleReviewInvoiceSubmit = async (reviewData) => {
    setReviewInvoiceLoading(true);
    try {
      console.log('Sending review data:', reviewData);
      const response = await invoiceReviewService.sendReview(reviewData);
      console.log('Review sent successfully:', response);
      setMessage('Invoice review sent successfully');
      setTimeout(() => setMessage(''), 3000);
      setShowReviewInvoiceModal(false);
    } catch (error) {
      console.error('Error sending invoice review:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Error sending invoice review';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setReviewInvoiceLoading(false);
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
    const bill = bills.find(b => b.billId === billId);
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
    setPaymentMethod('Cash');
    setChequeNumber('');
    setChequeDate('');
    setChequeAmount('');
    setBankName('Commercial Bank');
    setChequeAutoFilled(false);
    setChequeAutoFillData(null);
    setChequeType('new');
    setExistingCheques([]);
    setPaymentMode('full');
    setPartialPaymentAmount('');
  };

  // Load existing cheques with balance for this customer
  const loadExistingCheques = async (customerId) => {
    if (!customerId) return;
    try {
      setLoadingExistingCheques(true);
      const res = await apiClient.get(`/payments/customer/${customerId}/cheques`);
      const data = res.data;
      // Guard: ensure it's always an array regardless of what backend returns
      setExistingCheques(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load existing cheques:', err?.response?.status);
      setExistingCheques([]);
    } finally {
      setLoadingExistingCheques(false);
    }
  };

  // When user switches to "Existing" radio, load cheques for this customer
  const handleChequeTypeChange = (type) => {
    setChequeType(type);
    setChequeNumber('');
    setChequeDate('');
    setChequeAmount('');
    setChequeAutoFilled(false);
    setChequeAutoFillData(null);
    if (type === 'existing' && selectedBillForPayment) {
      loadExistingCheques(selectedBillForPayment.customerId);
    }
  };

  // When user picks an existing cheque from dropdown
  const handleExistingChequeSelect = (chequeNum) => {
    if (!chequeNum) {
      setChequeNumber('');
      setChequeDate('');
      setChequeAmount('');
      setChequeAutoFilled(false);
      return;
    }
    const found = existingCheques.find(c => c.chequeNumber === chequeNum);
    if (found) {
      setChequeNumber(found.chequeNumber);
      setChequeDate(found.chequeDate ? found.chequeDate.split('T')[0] : '');
      setChequeAmount(String(found.chequeAmount));
      setChequeAutoFilled(true);
    }
  };

  // Auto-fill cheque details when user finishes typing a cheque number
  const handleChequeNumberBlur = async (num) => {
    const trimmed = (num || '').trim();
    // Need at least 4 characters to be a valid cheque number
    if (!trimmed || trimmed.length < 4) {
      setChequeAutoFilled(false);
      setChequeAutoFillData(null);
      return;
    }
    try {
      const res = await apiClient.get(`/payments/cheque/${encodeURIComponent(trimmed)}`);
      const data = res.data;
      // Only auto-fill if the cheque has a valid amount (properly recorded cheque)
      if (data && data.chequeAmount > 0) {
        setChequeDate(data.chequeDate ? data.chequeDate.split('T')[0] : '');
        setChequeAmount(String(data.chequeAmount));
        setChequeAutoFilled(true);
        setChequeAutoFillData(data);
      } else {
        setChequeAutoFilled(false);
        setChequeAutoFillData(null);
      }
    } catch {
      // 404 = new cheque, user fills manually — this is normal
      setChequeAutoFilled(false);
      setChequeAutoFillData(null);
    }
  };
  
  const submitPayment = async () => {
    if (!selectedBillForPayment) return;
    
    // Validate partial payment amount
    if (paymentMode === 'partial') {
      const amount = parseFloat(partialPaymentAmount);
      const remaining = parseFloat(selectedBillForPayment.remainingAmount) || 
                       parseFloat(selectedBillForPayment.netTotal) || 
                       parseFloat(selectedBillForPayment.total) || 
                       0;
      
      if (!amount || amount <= 0) {
        setMessage('❌ Please enter a valid payment amount');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
      
      if (amount > remaining + 0.01) { // 0.01 tolerance for floating point
        setMessage(`❌ Payment amount (LKR ${formatAmount(amount)}) exceeds remaining balance (LKR ${formatAmount(remaining)})`);
        setTimeout(() => setMessage(''), 5000);
        return;
      }
    }
    
    // Validate based on payment method
    if (paymentMethod === 'Cheque') {
      if (!chequeNumber || !chequeDate || !chequeAmount) {
        setMessage('❌ Please fill in all cheque details (Number, Date, Amount)');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
      
      const amount = parseFloat(chequeAmount);
      if (isNaN(amount) || amount <= 0) {
        setMessage('❌ Please enter a valid cheque amount');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
    }
    
    if (paymentMethod === 'Bank Transfer') {
      if (!bankName) {
        setMessage('❌ Please select a bank');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
    }
    
    try {
      const paymentDetails = {
        paymentMethod,
        paidDate: new Date().toISOString(),
        ...(paymentMethod === 'Cheque' && {
          chequeNumber,
          chequeDate,
          chequeAmount: parseFloat(chequeAmount)
        }),
        ...(paymentMethod === 'Bank Transfer' && {
          bankName
        })
      };
      
      if (paymentMode === 'partial') {
        // Call partial payment endpoint
        await apiClient.patch(`/billing/${selectedBillForPayment.billId}/partial-pay`, {
          paymentAmount: parseFloat(partialPaymentAmount),
          ...paymentDetails
        });
        
        const newRemaining = (parseFloat(selectedBillForPayment.remainingAmount || selectedBillForPayment.netTotal) - parseFloat(partialPaymentAmount));
        const newStatus = newRemaining <= 0.01 ? 'Paid' : 'Partially Paid';
        
        setMessage(`✅ Partial payment of LKR ${formatAmount(partialPaymentAmount)} recorded successfully. Invoice status: ${newStatus}`);
      } else {
        // Call full payment endpoint
        await billingService.markAsPaid(selectedBillForPayment.billId, paymentDetails);
        setMessage(`✅ Invoice ${selectedBillForPayment.invoiceNumber || selectedBillForPayment.billId} marked as paid via ${paymentMethod}`);
      }
      
      setShowPaymentModal(false);
      setSelectedBillForPayment(null);
      fetchBills();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
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
    const billDate = formatDate(bill.billDate || bill.createdDate);
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
    const advancePaymentDateText = formatDate(rawAdvancePaymentDate);
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

    const printablePayItems = payItemsArray.map((item, index) => {
      let description = item.description || item.name || 'Service Charge';
      
      // Always transform to new format with place names
      const normalized = description.toLowerCase().trim();
      if (normalized.startsWith('transporter cost')) {
        const fromPlace = job.exporter || 'placename';
        const toPlace = job.transporter || 'placename';
        description = `transporter cost (from ${fromPlace} to ${toPlace})`;
      }
      
      const amount = parseFloat(item.billingAmount || item.amount || 0) || 0;
      const payItemId = item.id || item.payItemId || item.officePayItemId || `PI${String(index + 1).padStart(3, '0')}`;

      return {
        description,
        amount,
        payItemId
      };
    });

    const payItemsPerPage = 22;
    const printablePayItemPages = [];
    
    // Create pages with exactly 22 rows each
    for (let index = 0; index < printablePayItems.length; index += payItemsPerPage) {
      const pageItems = printablePayItems.slice(index, index + payItemsPerPage);
      
      // Fill remaining rows with empty items to make exactly 22 rows
      while (pageItems.length < payItemsPerPage) {
        pageItems.push({
          payItemId: '',
          description: '',
          amount: null
        });
      }
      
      printablePayItemPages.push(pageItems);
    }

    if (printablePayItemPages.length === 0) {
      const defaultPage = [{ payItemId: 'PI001', description: 'Service Charges', amount: grossTotal }];
      // Fill remaining rows with empty items
      while (defaultPage.length < payItemsPerPage) {
        defaultPage.push({
          payItemId: '',
          description: '',
          amount: null
        });
      }
      printablePayItemPages.push(defaultPage);
    }

    const hasMultiplePages = printablePayItemPages.length > 1;

    // Add transporter cost for FCL shipments
    if (job.shipmentCategory === 'FCL') {
      const hasTransporterCost = payItemsArray.some(item => {
        const label = (item?.name || item?.description || '').toLowerCase().trim();
        // Check if any transporter cost exists (old or new format)
        return label.startsWith('transporter cost');
      });
      if (!hasTransporterCost) {
        // Always use new format with place names
        const fromPlace = job.exporter || 'placename';
        const toPlace = job.transporter || 'placename';
        const description = `transporter cost (from ${fromPlace} to ${toPlace})`;
        payItemsArray.push({
          name: description,
          description: description,
          billingAmount: 0,
          amount: 0
        });
      }
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
            margin: ${isCompactItemsLayout ? '32mm 14mm 32mm 14mm' : '35mm 20mm 35mm 20mm'}; 
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
            font-size: 10pt;
            line-height: 1.3;
            color: #111;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .page-header {
            position: relative;
            margin-bottom: ${isCompactItemsLayout ? '8px' : '15px'};
            padding: ${isCompactItemsLayout ? '6px 8px 8px 8px' : '8px 10px 10px 10px'};
            margin-bottom: 15px;
            padding: 8px 10px 10px 10px;
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
            margin: ${isCompactItemsLayout ? '2px 0 4px 0' : '3px 0 6px 0'};
            line-height: 1.4;
          }
          .recipient-line {
            margin: ${isCompactItemsLayout ? '0px 0' : '1px 0'};
            font-size: ${isCompactItemsLayout ? '8.5pt' : '9pt'};
          }
          .details-section {
            margin: ${isCompactItemsLayout ? '4px 0 4px 0' : '6px 0 5px 0'};
            padding-bottom: 4px;
            border-bottom: 1px solid var(--theme-primary);
          }
          .detail-row {
            display: flex;
            margin: ${isCompactItemsLayout ? '0.5px 0' : '1px 0'};
            font-size: ${isCompactItemsLayout ? '8.5pt' : '9pt'};
          }
          .detail-label {
            font-weight: bold;
            width: 185px;
            min-width: 185px;
            min-width: 145px;
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
            margin: ${isCompactItemsLayout ? '2px 0 0 0' : '4px 0 0 0'};
            flex: 1;
          }
          .pay-items-page {
            width: 100%;
          }
          .pay-items-page:not(:last-child) {
            page-break-after: always;
            break-after: page;
          }
          .pay-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: ${isCompactItemsLayout ? '2px' : '4px'};
            font-size: ${isCompactItemsLayout ? '8pt' : '8.5pt'};
            border: 1px solid var(--theme-primary);
          }
          .pay-items-table th,
          .pay-items-table td {
            border: 1px solid #cfd7ea;
            padding: ${isCompactItemsLayout ? '2px 5px' : '3px 6px'};
            vertical-align: top;
          }
          .pay-items-table tbody td {
            line-height: 1.2;
            min-height: ${isCompactItemsLayout ? '16px' : '18px'};
          }
          .pay-items-table tbody tr {
            height: ${isCompactItemsLayout ? '16px' : '18px'};
          }
          .pay-items-table thead th {
            background: #e9efff;
            border-bottom: 2px solid var(--theme-primary);
            color: var(--theme-primary);
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          .pay-items-table .id-col {
            width: 90px;
            text-align: center;
            white-space: nowrap;
          }
          .pay-items-table .description-col {
            width: auto;
          }
          .pay-items-table .amount-col {
            width: 120px;
            text-align: right;
            white-space: nowrap;
          }
          .pay-items-table .pay-item-description {
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .invoice-summary {
            margin-top: ${isCompactItemsLayout ? '10px' : '14px'};
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 2rem;
          }
          .totals-box {
            flex-shrink: 0;
            border: 2px solid var(--theme-primary);
            padding: ${isCompactItemsLayout ? '6px 12px' : '8px 16px'};
            background: ${isColorMode ? 'linear-gradient(135deg, var(--theme-soft) 0%, #ffffff 100%)' : '#ffffff'};
            border-radius: 4px;
            min-width: 280px;
          }
          .totals-box .item-row {
            margin: ${isCompactItemsLayout ? '2px 0' : '3px 0'};
            padding: ${isCompactItemsLayout ? '1px 0' : '2px 0'};
          }
          .totals-box .item-row.subtotal {
            margin-top: ${isCompactItemsLayout ? '2px' : '3px'};
            padding-top: ${isCompactItemsLayout ? '2px' : '3px'};
          }
          .totals-box .item-row.total {
            margin-top: ${isCompactItemsLayout ? '3px' : '4px'};
            padding-top: ${isCompactItemsLayout ? '3px' : '4px'};
            padding-bottom: ${isCompactItemsLayout ? '2px' : '3px'};
          }
          .totals-section {
            position: relative;
            margin-top: ${isCompactItemsLayout ? '10px' : '14px'};
            background: #ffffff;
            padding-top: 4px;
            z-index: 2;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: ${isCompactItemsLayout ? '0px 0' : '1px 0'};
            font-size: ${isCompactItemsLayout ? '8.5pt' : '9pt'};
            padding: ${isCompactItemsLayout ? '0px 0' : '0.5px 0'};
            border-bottom: 1px solid #e0e0e0;
            page-break-inside: avoid;
          }
          .item-row.subtotal {
            border-top: 1px solid var(--theme-primary);
            border-bottom: none;
            margin-top: ${isCompactItemsLayout ? '1px' : '2px'};
            padding-top: ${isCompactItemsLayout ? '1px' : '2px'};
            font-weight: normal;
          }
          .item-row.total {
            border-top: 2px solid var(--theme-primary);
            border-bottom: none;
            margin-top: ${isCompactItemsLayout ? '1px' : '2px'};
            padding-top: ${isCompactItemsLayout ? '2px' : '3px'};
            padding-bottom: ${isCompactItemsLayout ? '1px' : '2px'};
            font-weight: bold;
            font-size: 10pt;
            color: var(--theme-primary);
          }
          .signature-section {
            position: relative;
            margin-top: 0;
            margin-left: 0;
            text-align: left;
            background: #ffffff;
            z-index: 3;
            flex-shrink: 0;
          }
          .signature-space {
            border-bottom: 1px solid var(--theme-primary);
            width: 280px;
            margin: ${isCompactItemsLayout ? '0 0 2px 0' : '0 0 2px 0'};
            height: 40px;
          }
          .signature-label {
            font-size: ${isCompactItemsLayout ? '8pt' : '8.5pt'};
            font-weight: bold;
            margin-top: 2px;
            color: var(--theme-primary);
          }
          .footer {
            margin-top: auto;
            padding-top: ${isCompactItemsLayout ? '10px' : '16px'};
            padding-top: 16px;
            padding-bottom: 6px;
            border-top: 1px solid var(--theme-primary);
            background: ${isColorMode ? 'linear-gradient(180deg, #ffffff 0%, var(--theme-soft) 100%)' : '#ffffff'};
            text-align: center;
            font-size: 8pt;
            line-height: 1.3;
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
        <div style="font-size: 10pt; font-weight: bold; margin-bottom: 6px; margin-top: 0;">
          INV No: ${invoiceNumber}
          <div style="font-size: 9pt; font-weight: normal; margin-top: 2px;">
            Date: ${formatDate(bill.invoiceDate || bill.billDate || bill.createdDate)}
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
            <div class="detail-value">: ${formatCusdecWithDate(job.cusdecNumber, job.cusdecDate)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Exporter</div>
            <div class="detail-value">: ${job.exporter || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">TT / LC / DA / DP / NFE No</div>
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
          ${printablePayItemPages.map((pageItems, pageIndex) => `
            <div class="pay-items-page">
              <table class="pay-items-table">
                <thead>
                  <tr>
                    <th class="id-col">ID</th>
                    <th class="description-col">DESCRIPTION</th>
                    <th class="amount-col">AMOUNT (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageItems.map(item => `
                    <tr>
                      <td class="id-col">${item.payItemId || ''}</td>
                      <td class="description-col"><span class="pay-item-description">${item.description || ''}</span></td>
                      <td class="amount-col">${item.amount !== null && item.amount !== undefined ? formatAmount(item.amount) : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>

        <div class="invoice-summary">
          <div class="signature-section">
            <div class="signature-space"></div>
            <div class="signature-label">SUPER SHINE CARGO SERVICES<br>MANAGER</div>
          </div>

          <div class="totals-box">
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
        </div>
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

  // Filter bills based on status and customer
  const filteredBills = bills.filter(bill => {
    const matchesStatus = statusFilter === 'All' || (bill.paymentStatus || 'Unpaid') === statusFilter;
    const matchesCustomer = customerFilter === 'All' || bill.customerId === customerFilter;
    return matchesStatus && matchesCustomer;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBills.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredBills.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedBillId(null);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1);
    setExpandedBillId(null);
  };

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
                      {formatCusdecWithDate(selectedJob.cusdecNumber, selectedJob.cusdecDate)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Exporter:</span>
                    <span className="info-value">{selectedJob.exporter || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">TT / LC / DA / DP / NFE Number: {(!selectedJob.lcNumber || selectedJob.lcNumber.trim() === '') && <span className="required-indicator">*Required</span>}</span>
                    <span className={`info-value ${(!selectedJob.lcNumber || selectedJob.lcNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.lcNumber || '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      Container Number: 
                      {!isVehicleShipmentCategory(selectedJob.shipmentCategory) && 
                       (!selectedJob.containerNumber || selectedJob.containerNumber.trim() === '') && 
                       <span className="required-indicator">*Required</span>}
                    </span>
                    <span className={`info-value ${!isVehicleShipmentCategory(selectedJob.shipmentCategory) && (!selectedJob.containerNumber || selectedJob.containerNumber.trim() === '') ? 'missing-value' : ''}`}>
                      {selectedJob.containerNumber || '-'}
                    </span>
                  </div>
                  {selectedJob.hasOwnProperty('transporter') && (
                    <div className="info-row">
                      <span className="info-label">
                        Transporter:
                        {selectedJob.shipmentCategory === 'FCL' && 
                         (!selectedJob.transporter || selectedJob.transporter.trim() === '') && 
                         <span className="required-indicator">*Required</span>}
                      </span>
                      <select 
                        className="info-value transporter-dropdown"
                        value={transporters.find(t => t.name === selectedJob.transporter)?.transporterId || ''}
                        onChange={(e) => handleTransporterChange(e.target.value)}
                      >
                        <option value="">Select Transporter</option>
                        {transporters.map(transporter => (
                          <option key={transporter.transporterId} value={transporter.transporterId}>
                            {transporter.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">
                      Transport Delivery Date: 
                      {selectedJob.shipmentCategory === 'FCL' && 
                       (!selectedJob.transportDeliveryDate || (typeof selectedJob.transportDeliveryDate === 'string' && selectedJob.transportDeliveryDate.trim() === '')) && 
                       <span className="required-indicator">*Required</span>}
                    </span>
                    <span className={`info-value ${selectedJob.shipmentCategory === 'FCL' && (!selectedJob.transportDeliveryDate || (typeof selectedJob.transportDeliveryDate === 'string' && selectedJob.transportDeliveryDate.trim() === '')) ? 'missing-value' : ''}`}>
                      {formatDate(selectedJob.transportDeliveryDate)}
                    </span>
                  </div>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={addTransporterCostFromHeader} 
                        className="btn btn-secondary btn-small"
                      >
                        + Transporter Cost
                      </button>
                      <button 
                        onClick={openPayItemsEditor} 
                        className="btn btn-primary btn-small"
                      >
                        + Add More Items
                      </button>
                    </div>
                  )}
                  {!showPayItemsRow && (!selectedJob.payItems || selectedJob.payItems.length === 0) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={addTransporterCostFromHeader} 
                        className="btn btn-secondary btn-small"
                      >
                        + Transporter Cost
                      </button>
                      <button 
                        onClick={openPayItemsEditor} 
                        className="btn btn-primary btn-small"
                      >
                        + Add Items
                      </button>
                    </div>
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
                          <th>Bill</th>
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
                            <td data-label="Bill" className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={item.hasBill || false}
                                onChange={(e) => handlePayItemChange(index, 'hasBill', e.target.checked)}
                                disabled={!canEditPayItems()}
                                title={item.hasBill ? "Bill/Receipt exists" : "No bill/receipt"}
                              />
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
                              {payItems.length > 1 && !item.paidByName && !(selectedJob?.shipmentCategory === 'FCL' && isTransporterCostLabel(item.name)) && (
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
                      <tfoot className="pay-items-totals-footer">
                        <tr className="totals-row">
                          <td className="total-label"><strong>Total</strong></td>
                          <td className="total-amount"><strong>{formatAmount(calculateUnsavedTotals().actualCost)}</strong></td>
                          <td></td>
                          <td></td>
                          <td className="total-amount"><strong>{formatAmount(calculateUnsavedTotals().billingAmount)}</strong></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr className={`profit-row ${calculateUnsavedTotals().profit < 0 ? 'profit-negative-row' : ''}`}>
                          <td className="profit-label"><strong>Profit Margin</strong></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td className={`profit-amount ${calculateUnsavedTotals().profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                            <strong>{formatAmount(calculateUnsavedTotals().profit)}</strong>
                            <span className="profit-percentage">({calculateUnsavedTotals().profitMargin.toFixed(2)}%)</span>
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <div className="pay-items-actions">
                      <div className="add-items-buttons">
                        {selectedJob?.shipmentCategory !== 'FCL' && !hasTransporterCostItem(payItems) && (
                          <button onClick={addTransporterCostRow} className="btn btn-primary btn-small">
                            + Add Transporter Cost
                          </button>
                        )}
                        {!(payItems.length === 1 && isTransporterCostLabel(payItems[0]?.name || payItems[0]?.description)) && (
                          <button onClick={addPayItemRow} className="btn btn-secondary btn-small">
                            + Add Another Item
                          </button>
                        )}
                      </div>
                      <div className="action-buttons-right">
                        <button onClick={savePayItems} className="btn btn-success">
                          Save Pay Items
                        </button>
                        <button 
                          onClick={() => {
                            setShowPayItemsRow(false);
                            setPayItems([]);
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
                      <div>
                        <h4>PAY ITEMS REVIEW</h4>
                        <p className="review-subtitle">Review all pay items before generating invoice</p>
                      </div>
                    </div>

                    <table className="pay-items-review-table">
                      <colgroup>
                        {canEditPayItems() ? (
                          <>
                            <col style={{width: '50%'}} />
                            <col style={{width: '20%'}} />
                            <col style={{width: '20%'}} />
                            <col style={{width: '10%'}} />
                          </>
                        ) : (
                          <>
                            <col style={{width: '40%'}} />
                            <col style={{width: '30%'}} />
                            <col style={{width: '30%'}} />
                          </>
                        )}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="col-description">Description</th>
                          <th className="col-amount">Actual Cost (LKR)</th>
                          <th className="col-amount">Billing Amount (LKR)</th>
                          {canEditPayItems() && <th className="col-actions">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedJob.payItems.map((item, idx) => {
                          const itemDescription = item.description || item.name || '';
                          let displayDescription = itemDescription;
                          
                          // Always transform to new format with place names
                          const normalized = itemDescription.toLowerCase().trim();
                          if (normalized.startsWith('transporter cost')) {
                            const fromPlace = selectedJob.exporter || 'placename';
                            const toPlace = selectedJob.transporter || 'placename';
                            displayDescription = `transporter cost (from ${fromPlace} to ${toPlace})`;
                          }
                          
                          return (
                          <tr key={idx} className="pay-item-row">
                            <td className="col-description">{displayDescription}</td>
                            <td className="col-amount">
                              {formatAmount(parseFloat(item.actualCost) || parseFloat(item.amount) || 0)}
                            </td>
                            <td className="col-amount">
                              {editingPayItemIndex === idx ? (
                                <input
                                  type="text"
                                  className="inline-edit-input"
                                  value={editingBillingAmount}
                                  onChange={(e) => setEditingBillingAmount(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineEditedPayItem();
                                    else if (e.key === 'Escape') cancelEditingPayItem();
                                  }}
                                  autoFocus
                                />
                              ) : (
                                formatAmount(parseFloat(item.billingAmount) || parseFloat(item.amount) || 0)
                              )}
                            </td>
                            {canEditPayItems() && (
                              <td className="col-actions">
                                {editingPayItemIndex === idx ? (
                                  <div className="action-btns">
                                    <button className="action-btn save-btn" onClick={saveInlineEditedPayItem} title="Save">✓</button>
                                    <button className="action-btn cancel-btn" onClick={cancelEditingPayItem} title="Cancel">✗</button>
                                  </div>
                                ) : (
                                  <div className="action-btns">
                                    <button className="action-btn edit-btn" onClick={() => startEditingPayItem(idx)} title="Edit billing amount">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button className="action-btn remove-btn" onClick={() => removePayItem(idx)} title="Remove">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                        })}
                      </tbody>
                      <tfoot>
                        {/* Total Row */}
                        <tr className="">
                          <td className="col-description"><strong>Total</strong></td>
                          <td className="col-amount"><strong>{formatAmount(calculateTotals().actualCost)}</strong></td>
                          <td className="col-amount"><strong>{formatAmount(calculateTotals().billingAmount)}</strong></td>
                          {canEditPayItems() && <td className="col-actions"></td>}
                        </tr>
                        {/* Profit Margin Row */}
                        <tr className="profit-row">
                          <td className="col-description"><strong>PROFIT MARGIN</strong></td>
                          <td className="col-amount"></td>
                          <td className={`col-amount profit-amount ${calculateTotals().profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                            <strong>{formatAmount(calculateTotals().profit)}</strong>
                          </td>
                          {canEditPayItems() && <td className="col-actions"></td>}
                        </tr>
                        {/* Invoice Summary Header */}
                        <tr className="summary-header-row">
                          <td className="col-description" colSpan={canEditPayItems() ? 4 : 3}><strong>INVOICE SUMMARY</strong></td>
                        </tr>
                        {/* Gross Total */}
                        <tr className="gross-total-row">
                          <td className="col-description">Gross Total</td>
                          <td className="col-amount"></td>
                          <td className="col-amount"><strong>{formatAmount(calculateTotals().grossTotal)}</strong></td>
                          {canEditPayItems() && <td className="col-actions"></td>}
                        </tr>
                        {/* Advance Payment */}
                        {selectedJob.advancePayment > 0 && (
                          <tr className="advance-payment-row">
                            <td className="col-description">Advance Payment</td>
                            <td className="col-amount"></td>
                            <td className="col-amount advance-deduction">
                              <strong>({formatAmount(calculateTotals().advancePayment)})</strong>
                            </td>
                            {canEditPayItems() && <td className="col-actions"></td>}
                          </tr>
                        )}
                        {/* Net Total */}
                        <tr className="net-total-row">
                          <td className="col-description"><strong>NET TOTAL (CUSTOMER PAYABLE)</strong></td>
                          <td className="col-amount net-total-divider"></td>
                          <td className="col-amount net-total-amount">
                            <strong>{formatAmount(calculateTotals().netTotal)}</strong>
                          </td>
                          {canEditPayItems() && <td className="col-actions"></td>}
                        </tr>
                      </tfoot>
                    </table>

                    <div className="generate-bill-section">
                      <button 
                        onClick={() => setShowReviewInvoiceModal(true)} 
                        className="btn btn-secondary btn-small"
                        disabled={!selectedJob || !selectedJob.payItems || selectedJob.payItems.length === 0 || !getAssignedClerks().length}
                      >
                        📋 Review Invoice
                      </button>
                      <button onClick={generateBill} className="btn btn-primary btn-small">
                        ✓ Generate Invoice
                      </button>
                      {showValidationModal && (
                        <div className="validation-modal-overlay">
                          <div className="validation-modal">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowGeneratedInvoices(!showGeneratedInvoices)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                fontSize: '18px',
                color: '#374151'
              }}
              title={showGeneratedInvoices ? 'Collapse' : 'Expand'}
            >
              {showGeneratedInvoices ? '▼' : '▶'}
            </button>
            <h2>Generated Invoices ({filteredBills.length})</h2>
            {(statusFilter !== 'All' || customerFilter !== 'All') && (
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setCustomerFilter('All');
                  setCurrentPage(1);
                }}
                className="btn-secondary"
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Clear all filters"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 600 }}>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ minWidth: '150px', padding: '6px 10px' }}
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 600 }}>Customer</span>
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ minWidth: '200px', padding: '6px 10px' }}
              >
                <option value="All">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.customerId} value={customer.customerId}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
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
        </div>
        {showGeneratedInvoices && (
          <>
            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <p>{bills.length === 0 ? 'No invoices generated yet' : 'No invoices match the selected filters'}</p>
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
                {currentRecords.map(bill => (
                  <React.Fragment key={bill.billId}>
                    <tr className={bill.isOverdue ? 'overdue-row' : ''}>
                      <td data-label="Invoice No"><strong>{bill.invoiceNumber || bill.billId}</strong></td>
                      <td data-label="Job ID">{bill.jobId}</td>
                      <td data-label="Customer">{getCustomerName(bill.customerId)}</td>
                      <td data-label="Invoice Date">
                        {formatDate(bill.invoiceDate)}
                      </td>
                      <td data-label="Due Date">
                        {bill.dueDate ? (
                          <div className="due-date-cell">
                            {formatDate(bill.dueDate)}
                            {bill.isOverdue && <span className="overdue-badge">OVERDUE</span>}
                          </div>
                        ) : '-'}
                      </td>
                      <td data-label="Status">
                        <div className="status-cell">
                          <span className={`status-badge status-${(bill.paymentStatus || 'unpaid').toLowerCase().replace(' ', '-')}`}>
                            {bill.paymentStatus || 'Unpaid'}
                          </span>
                        </div>
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
                          {(bill.paymentStatus === 'Unpaid' || bill.paymentStatus === 'Partially Paid') && (
                            <>
                              <button 
                                onClick={() => markAsPaid(bill.billId)} 
                                className={`btn ${bill.paymentStatus === 'Partially Paid' ? 'btn-primary' : 'btn-success'} btn-small`}
                              >
                                {bill.paymentStatus === 'Partially Paid' ? 'Pay Remaining' : 'Pay Invoice'}
                              </button>
                            </>
                          )}
                          {bill.paymentStatus === 'Paid' && (
                            <span className="paid-indicator">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Paid
                            </span>
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
                                <div className="detail-value">
                                  LKR {formatAmount(bill.profit)}
                                </div>
                              </div>
                              {/* Show Paid Amount + Total Due cards for Partially Paid only */}
                              {bill.paymentStatus === 'Partially Paid' && (
                                <>
                                  <div className="detail-card detail-card--paid">
                                    <div className="detail-label">Amount Paid</div>
                                    <div className="detail-value detail-value--paid">
                                      LKR {formatAmount(bill.paidAmount || 0)}
                                    </div>
                                    <div className="detail-card-sub">
                                      {Math.round((parseFloat(bill.paidAmount || 0) / parseFloat(bill.netTotal || bill.total || 1)) * 100)}% of invoice settled
                                    </div>
                                  </div>
                                  <div className="detail-card detail-card--remaining">
                                    <div className="detail-label">Total Due</div>
                                    <div className="detail-value detail-value--remaining">
                                      LKR {formatAmount(bill.remainingAmount || 0)}
                                    </div>
                                    <div className="detail-card-sub">
                                      {Math.round((parseFloat(bill.remainingAmount || 0) / parseFloat(bill.netTotal || bill.total || 1)) * 100)}% outstanding
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Payment Tracking Table — shown for Partially Paid and Paid invoices */}
                            {(bill.paymentStatus === 'Partially Paid' || bill.paymentStatus === 'Paid') && (
                              <div className="payment-tracking-section">
                                <div className="payment-tracking-header">
                                  <span className="payment-tracking-title">Payment Tracking</span>
                                  <span className="payment-tracking-count">
                                    {Array.isArray(bill.paymentRecords) && bill.paymentRecords.length > 0 
                                      ? `${bill.paymentRecords.length} payment record${bill.paymentRecords.length !== 1 ? 's' : ''}`
                                      : '1 payment record'
                                    }
                                  </span>
                                </div>
                                
                                <div className="payment-tracking-table">
                                  <div className="payment-table-header">
                                    <div className="payment-header-cell payment-date-col">#</div>
                                    <div className="payment-header-cell payment-date-col">Payment Date</div>
                                    <div className="payment-header-cell payment-method-col">Method</div>
                                    <div className="payment-header-cell payment-reference-col">Reference</div>
                                    <div className="payment-header-cell payment-amount-col">Amount Paid</div>
                                    <div className="payment-header-cell payment-balance-col">Remaining Balance</div>
                                  </div>
                                  
                                  <div className="payment-table-body">
                                    {bill.paymentRecords && Array.isArray(bill.paymentRecords) && bill.paymentRecords.length > 0 ? (
                                      bill.paymentRecords.map((payment, idx) => {
                                        // Calculate running balance
                                        const paidUpToThisPoint = bill.paymentRecords
                                          .slice(0, idx + 1)
                                          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                                        const remainingAtThisPoint = (parseFloat(bill.netTotal || bill.total || 0)) - paidUpToThisPoint;
                                        
                                        return (
                                          <div key={idx} className="payment-table-row">
                                            <div className="payment-table-cell payment-date-col">
                                              <span className="payment-num">{idx + 1}</span>
                                            </div>
                                            <div className="payment-table-cell payment-date-col">
                                              {formatDateWithMonth(payment.paymentDate)}
                                            </div>
                                            <div className="payment-table-cell payment-method-col">
                                              <span className={`payment-method-badge payment-method-${payment.paymentMethod?.toLowerCase().replace(' ', '-')}`}>
                                                {payment.paymentMethod === 'Cash' && '💵'}
                                                {payment.paymentMethod === 'Cheque' && '📝'}
                                                {payment.paymentMethod === 'Bank Transfer' && '🏦'}
                                                {' '}{payment.paymentMethod || '-'}
                                              </span>
                                            </div>
                                            <div className="payment-table-cell payment-reference-col">
                                              {payment.paymentMethod === 'Cheque' && payment.chequeNumber ? (
                                                <span className="reference-text">CHQ: {payment.chequeNumber}</span>
                                              ) : payment.paymentMethod === 'Bank Transfer' && payment.bankName ? (
                                                <span className="reference-text">{payment.bankName}</span>
                                              ) : payment.paymentMethod === 'Cash' ? (
                                                <span className="reference-text">Cash</span>
                                              ) : (
                                                <span className="reference-empty">-</span>
                                              )}
                                            </div>
                                            <div className="payment-table-cell payment-amount-col">
                                              <span className="payment-amount-value">LKR {formatAmount(payment.amount || 0)}</span>
                                            </div>
                                            <div className="payment-table-cell payment-balance-col">
                                              <span className="payment-balance-value">LKR {formatAmount(Math.max(0, remainingAtThisPoint))}</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="payment-table-row">
                                        <div className="payment-table-cell payment-date-col">
                                          <span className="payment-num">1</span>
                                        </div>
                                        <div className="payment-table-cell payment-date-col">
                                          {formatDateWithMonth(bill.paidDate)}
                                        </div>
                                        <div className="payment-table-cell payment-method-col">
                                          <span className={`payment-method-badge payment-method-${bill.paymentMethod?.toLowerCase().replace(' ', '-')}`}>
                                            {bill.paymentMethod === 'Cash' && '💵'}
                                            {bill.paymentMethod === 'Cheque' && '📝'}
                                            {bill.paymentMethod === 'Bank Transfer' && '🏦'}
                                            {' '}{bill.paymentMethod || '-'}
                                          </span>
                                        </div>
                                        <div className="payment-table-cell payment-reference-col">
                                          {bill.paymentMethod === 'Cheque' && bill.chequeNumber ? (
                                            <span className="reference-text">CHQ: {bill.chequeNumber}</span>
                                          ) : bill.paymentMethod === 'Bank Transfer' && bill.bankName ? (
                                            <span className="reference-text">{bill.bankName}</span>
                                          ) : bill.paymentMethod === 'Cash' ? (
                                            <span className="reference-text">Cash</span>
                                          ) : (
                                            <span className="reference-empty">-</span>
                                          )}
                                        </div>
                                        <div className="payment-table-cell payment-amount-col">
                                          <span className="payment-amount-value">LKR {formatAmount(bill.paidAmount || 0)}</span>
                                        </div>
                                        <div className="payment-table-cell payment-balance-col">
                                          <span className="payment-balance-value">LKR {formatAmount(bill.remainingAmount || 0)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="payment-total-row">
                                    <div className="payment-table-cell payment-date-col"></div>
                                    <div className="payment-table-cell payment-date-col"></div>
                                    <div className="payment-table-cell payment-method-col"></div>
                                    <div className="payment-table-cell payment-reference-col">
                                      <strong>Total</strong>
                                    </div>
                                    <div className="payment-table-cell payment-amount-col">
                                      <strong>LKR {formatAmount(bill.paidAmount || 0)}</strong>
                                    </div>
                                    <div className="payment-table-cell payment-balance-col">
                                      <strong>LKR {formatAmount(bill.remainingAmount || 0)}</strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Payment Information — shown for Fully Paid invoices */}
                            {bill.paymentStatus === 'Paid' && bill.paymentMethod && (
                              <div className="payment-details-section">
                                <h4 className="payment-details-title">💳 Payment Information</h4>
                                <div className="payment-details-grid">
                                  <div className="payment-detail-card">
                                    <div className="payment-detail-label">Payment Method</div>
                                    <div className="payment-detail-value">
                                      <span className={`payment-method-badge payment-method-${bill.paymentMethod.toLowerCase().replace(' ', '-')}`}>
                                        {bill.paymentMethod === 'Cash' && '💵'}
                                        {bill.paymentMethod === 'Cheque' && '📝'}
                                        {bill.paymentMethod === 'Bank Transfer' && '🏦'}
                                        {' '}{bill.paymentMethod}
                                      </span>
                                    </div>
                                  </div>

                                  {bill.paidDate && (
                                    <div className="payment-detail-card">
                                      <div className="payment-detail-label">Payment Date</div>
                                      <div className="payment-detail-value">
                                        {formatDateWithFullMonth(bill.paidDate)}
                                      </div>
                                    </div>
                                  )}

                                  {bill.paymentMethod === 'Cheque' && (
                                    <>
                                      {bill.chequeNumber && (
                                        <div className="payment-detail-card">
                                          <div className="payment-detail-label">Cheque Number</div>
                                          <div className="payment-detail-value cheque-number">
                                            {bill.chequeNumber}
                                          </div>
                                        </div>
                                      )}
                                      {bill.chequeDate && (
                                        <div className="payment-detail-card">
                                          <div className="payment-detail-label">Cheque Date</div>
                                          <div className="payment-detail-value">
                                            {formatDateWithFullMonth(bill.chequeDate)}
                                          </div>
                                        </div>
                                      )}
                                      {bill.chequeAmount && (
                                        <div className="payment-detail-card">
                                          <div className="payment-detail-label">Cheque Amount</div>
                                          <div className="payment-detail-value amount-highlight">
                                            LKR {formatAmount(bill.chequeAmount)}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {bill.paymentMethod === 'Bank Transfer' && bill.bankName && (
                                    <div className="payment-detail-card">
                                      <div className="payment-detail-label">Bank Name</div>
                                      <div className="payment-detail-value bank-name">
                                        🏦 {bill.bankName}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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

        {bills.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={bills.length}
            recordsPerPage={recordsPerPage}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
          />
        )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
           RECORD PAYMENT MODAL  —  3-Row Professional Layout
           Row 1: Invoice details strip
           Row 2: Payment type (Full / Partial) + amount
           Row 3: Payment method + cheque / bank fields
      ═══════════════════════════════════════════════════════ */}
      {showPaymentModal && selectedBillForPayment && (
        <div className="pm-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>

            {/* ── Title bar ── */}
            <div className="pm-titlebar">
              <div className="pm-titlebar-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <div>
                  <span className="pm-title">Record Payment</span>
                  <span className="pm-subtitle">Invoice&nbsp;#{selectedBillForPayment.invoiceNumber || selectedBillForPayment.billId}</span>
                </div>
              </div>
              <button className="pm-close" onClick={() => setShowPaymentModal(false)} aria-label="Close">×</button>
            </div>

            {/* ══════════════════════════════════════════
                ROW 1 — Invoice details (horizontal strip)
            ══════════════════════════════════════════ */}
            <div className="pm-body">
            <div className="pm-row pm-row-details">
              <div className="pm-detail-cell">
                <span className="pm-detail-label">Customer</span>
                <span className="pm-detail-value">{getCustomerName(selectedBillForPayment.customerId)}</span>
              </div>
              <div className="pm-detail-cell">
                <span className="pm-detail-label">Job ID</span>
                <span className="pm-detail-value"><code className="pm-code">{selectedBillForPayment.jobId}</code></span>
              </div>
              <div className="pm-detail-cell">
                <span className="pm-detail-label">Invoice Total</span>
                <span className="pm-detail-value pm-amount-total">LKR {formatAmount(selectedBillForPayment.netTotal || selectedBillForPayment.total)}</span>
              </div>
              {parseFloat(selectedBillForPayment.paidAmount) > 0 && (
                <div className="pm-detail-cell">
                  <span className="pm-detail-label">Already Paid</span>
                  <span className="pm-detail-value pm-amount-paid">LKR {formatAmount(selectedBillForPayment.paidAmount)}</span>
                </div>
              )}
              <div className={parseFloat(selectedBillForPayment.paidAmount) > 0 ? 'pm-detail-cell pm-detail-cell--due' : 'pm-detail-cell pm-detail-cell--due pm-detail-cell--due-only'}>
                <span className="pm-detail-label">Amount Due</span>
                <span className="pm-detail-value pm-amount-due">
                  LKR {formatAmount(
                    parseFloat(selectedBillForPayment.remainingAmount) > 0
                      ? selectedBillForPayment.remainingAmount
                      : (parseFloat(selectedBillForPayment.netTotal || selectedBillForPayment.total) - parseFloat(selectedBillForPayment.paidAmount || 0))
                  )}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════
                ROW 2 — Payment type + amount
            ══════════════════════════════════════════ */}
            <div className="pm-row pm-row-type">

              {/* Left: radio buttons */}
              <div className="pm-type-panel">
                <p className="pm-panel-label">Payment Type</p>
                <div className="pm-radio-group">
                  <label
                    className={`pm-radio-card ${paymentMode === 'full' ? 'pm-radio-card--active' : ''}`}
                    onClick={() => { setPaymentMode('full'); setPartialPaymentAmount(''); }}
                  >
                    <input
                      type="radio" name="pmMode" value="full"
                      checked={paymentMode === 'full'}
                      onChange={() => { setPaymentMode('full'); setPartialPaymentAmount(''); }}
                    />
                    <span className="pm-radio-dot"></span>
                    <span className="pm-radio-text">
                      <strong>Full Payment</strong>
                      <small>Settle entire balance</small>
                    </span>
                  </label>
                  <label
                    className={`pm-radio-card ${paymentMode === 'partial' ? 'pm-radio-card--active' : ''}`}
                    onClick={() => setPaymentMode('partial')}
                  >
                    <input
                      type="radio" name="pmMode" value="partial"
                      checked={paymentMode === 'partial'}
                      onChange={() => setPaymentMode('partial')}
                    />
                    <span className="pm-radio-dot"></span>
                    <span className="pm-radio-text">
                      <strong>Partial Payment</strong>
                      <small>Pay a portion now</small>
                    </span>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="pm-col-divider" />

              {/* Right: amount area */}
              <div className="pm-amount-panel">
                {paymentMode === 'full' ? (
                  <div className="pm-full-amount-display">
                    <p className="pm-panel-label">Amount to Collect</p>
                    <div className="pm-full-amount">
                      LKR {formatAmount(
                        parseFloat(selectedBillForPayment.remainingAmount) > 0
                          ? selectedBillForPayment.remainingAmount
                          : (parseFloat(selectedBillForPayment.netTotal || selectedBillForPayment.total) - parseFloat(selectedBillForPayment.paidAmount || 0))
                      )}
                    </div>
                    <span className="pm-full-badge">Full balance</span>
                  </div>
                ) : (
                  <div className="pm-partial-area">
                    <div className="pm-field">
                      <label className="pm-field-label">Enter Amount (LKR) <span className="pm-req">*</span></label>
                      <input
                        type="number" step="0.01"
                        className="pm-input pm-input--amount"
                        value={partialPaymentAmount}
                        onChange={e => setPartialPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    {/* Mini breakdown */}
                    <div className="pm-breakdown">
                      <div className="pm-bk-row">
                        <span>Invoice Total</span>
                        <span>LKR {formatAmount(parseFloat(selectedBillForPayment.netTotal || selectedBillForPayment.total) || 0)}</span>
                      </div>
                      {parseFloat(selectedBillForPayment.paidAmount) > 0 && (
                        <div className="pm-bk-row">
                          <span>Already Paid</span>
                          <span className="pm-bk-paid">LKR {formatAmount(parseFloat(selectedBillForPayment.paidAmount))}</span>
                        </div>
                      )}
                      <div className="pm-bk-row">
                        <span>This Payment</span>
                        <span className="pm-bk-current">LKR {formatAmount(parseFloat(partialPaymentAmount) || 0)}</span>
                      </div>
                      <div className="pm-bk-row pm-bk-row--total">
                        <span>Remaining After</span>
                        <span>LKR {formatAmount(Math.max(0,
                          (parseFloat(selectedBillForPayment.remainingAmount) ||
                           parseFloat(selectedBillForPayment.netTotal || selectedBillForPayment.total) -
                           parseFloat(selectedBillForPayment.paidAmount || 0))
                          - (parseFloat(partialPaymentAmount) || 0)
                        ))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>{/* end ROW 2 */}

            {/* ══════════════════════════════════════════
                ROW 3 — Payment method + details
            ══════════════════════════════════════════ */}
            <div className="pm-row pm-row-method">

              {/* Left: method selector */}
              <div className="pm-method-panel">
                <p className="pm-panel-label">Payment Method</p>
                <div className="pm-method-tabs">
                  {['Cash','Cheque','Bank Transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`pm-method-tab ${paymentMethod === m ? 'pm-method-tab--active' : ''}`}
                      onClick={() => {
                        setPaymentMethod(m);
                        setChequeAutoFilled(false);
                        setChequeAutoFillData(null);
                        setChequeType('new');
                        setExistingCheques([]);
                      }}
                    >
                      {m === 'Cash' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>}
                      {m === 'Cheque' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>}
                      {m === 'Bank Transfer' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                      {m}
                    </button>
                  ))}
                </div>

                {/* Cash — no extra fields */}
                {paymentMethod === 'Cash' && (
                  <div className="pm-cash-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Cash payment — no additional details required.
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="pm-col-divider" />

              {/* Right: cheque / bank fields */}
              <div className="pm-details-panel">

                {/* ── Cheque ── */}
                {paymentMethod === 'Cheque' && (
                  <>
                    <p className="pm-panel-label">Cheque Details</p>

                    {/* Cheque type toggle */}
                    <div className="pm-cheque-type-row">
                      <label className="pm-radio-inline">
                        <input type="radio" name="chequeType" value="new" checked={chequeType === 'new'} onChange={() => handleChequeTypeChange('new')} />
                        New Cheque
                      </label>
                      <label className="pm-radio-inline">
                        <input type="radio" name="chequeType" value="existing" checked={chequeType === 'existing'} onChange={() => handleChequeTypeChange('existing')} />
                        Existing Cheque
                      </label>
                    </div>

                    {/* Existing cheque picker */}
                    {chequeType === 'existing' && (
                      <div className="pm-field pm-field--full">
                        <label className="pm-field-label">Select Cheque <span className="pm-req">*</span></label>
                        {loadingExistingCheques ? (
                          <span className="pm-loading">Loading cheques…</span>
                        ) : !Array.isArray(existingCheques) || existingCheques.length === 0 ? (
                          <div className="pm-info-box">No cheques with remaining balance found for this customer.</div>
                        ) : (
                          <select className="pm-input" value={chequeNumber} onChange={e => handleExistingChequeSelect(e.target.value)}>
                            <option value="">— Select a cheque —</option>
                            {existingCheques.map(c => (
                              <option key={c.chequeNumber} value={c.chequeNumber}>
                                Cheque #{c.chequeNumber} — Balance: LKR {parseFloat(c.remainingBalance).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Cheque fields grid */}
                    {(chequeType === 'new' || (chequeType === 'existing' && chequeNumber)) && (
                      <div className="pm-fields-grid">
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Number <span className="pm-req">*</span></label>
                          <input type="text" className="pm-input"
                            value={chequeNumber}
                            onChange={e => { setChequeNumber(e.target.value); setChequeAutoFilled(false); }}
                            onBlur={e => chequeType === 'new' && handleChequeNumberBlur(e.target.value)}
                            placeholder="e.g. 001234"
                            readOnly={chequeType === 'existing'}
                          />
                        </div>
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Date <span className="pm-req">*</span></label>
                          <input type="date" className="pm-input"
                            value={chequeDate}
                            onChange={e => setChequeDate(e.target.value)}
                            readOnly={chequeType === 'existing'}
                          />
                          {chequeAutoFilled && <small className="pm-autofill">✓ Auto-filled</small>}
                        </div>
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Amount (LKR) <span className="pm-req">*</span></label>
                          <input type="number" step="0.01" className="pm-input"
                            value={chequeAmount}
                            onChange={e => setChequeAmount(e.target.value)}
                            placeholder="0.00"
                            readOnly={chequeType === 'existing'}
                          />
                          {chequeAutoFilled && <small className="pm-autofill">✓ Auto-filled</small>}
                          <small className="pm-hint">Total value written on cheque</small>
                        </div>
                        <div className="pm-field">
                          <label className="pm-field-label">Bank Name</label>
                          <select className="pm-input" value={bankName} onChange={e => setBankName(e.target.value)} disabled={chequeType === 'existing'}>
                            <option>Commercial Bank</option>
                            <option>Peoples Bank</option>
                            <option>Bank of Ceylon</option>
                            <option>Hatton National Bank</option>
                            <option>Sampath Bank</option>
                            <option>Nations Trust Bank</option>
                            <option>DFCC Bank</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Bank Transfer ── */}
                {paymentMethod === 'Bank Transfer' && (
                  <>
                    <p className="pm-panel-label">Transfer Details</p>
                    <div className="pm-fields-grid">
                      <div className="pm-field pm-field--full">
                        <label className="pm-field-label">Bank Name <span className="pm-req">*</span></label>
                        <select className="pm-input" value={bankName} onChange={e => setBankName(e.target.value)}>
                          <option>Commercial Bank</option>
                          <option>Peoples Bank</option>
                          <option>Bank of Ceylon</option>
                          <option>Hatton National Bank</option>
                          <option>Sampath Bank</option>
                          <option>Nations Trust Bank</option>
                          <option>DFCC Bank</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Cash placeholder ── */}
                {paymentMethod === 'Cash' && (
                  <div className="pm-empty-panel">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                    <p>No additional details needed for cash.</p>
                  </div>
                )}

              </div>{/* end pm-details-panel */}

            </div>{/* end ROW 3 */}
            </div>{/* end pm-body */}

            {/* ── Footer ── */}
            <div className="pm-footer">
              <button className="pm-btn pm-btn--cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="pm-btn pm-btn--confirm" onClick={submitPayment}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm Payment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Review Invoice Modal */}
      <ReviewInvoiceModal
        show={showReviewInvoiceModal}
        onClose={() => setShowReviewInvoiceModal(false)}
        job={selectedJob}
        assignedClerks={getAssignedClerks()}
        onSubmit={handleReviewInvoiceSubmit}
        loading={reviewInvoiceLoading}
      />

      {/* OLD INVOICES SECTION */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowOldInvoices(!showOldInvoices)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                fontSize: '18px',
                color: '#374151'
              }}
              title={showOldInvoices ? 'Collapse' : 'Expand'}
            >
              {showOldInvoices ? '▼' : '▶'}
            </button>
            <h2>Old Invoice Management ({oldInvoices.length})</h2>
            {user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive') && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingOldInvoice(null);
                  setOldInvoiceFormData({
                    customerId: '',
                    cusdecNumber: '',
                    cusdecDate: '',
                    invoiceDate: '',
                    invoiceNumberSuffix: '',
                    totalAmount: '',
                    settleDate: ''
                  });
                  setOldInvoiceFormErrors({});
                  setShowOldInvoiceModal(true);
                }}
                style={{ marginLeft: 'auto' }}
              >
                + Add Old Invoice
              </button>
            )}
          </div>
          {showOldInvoices && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 600 }}>Status</span>
                <select
                  value={oldInvoiceFilterStatus}
                  onChange={(e) => setOldInvoiceFilterStatus(e.target.value)}
                  className="form-control"
                  style={{ minWidth: '150px', padding: '6px 10px' }}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Fully Settled">Fully Settled</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search by invoice number, customer, or cusdec..."
                  value={oldInvoiceSearchTerm}
                  onChange={(e) => setOldInvoiceSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ padding: '6px 10px' }}
                />
              </div>
            </div>
          )}
        </div>

        {showOldInvoices && (
          <>
            {oldInvoices.filter(invoice => {
              const matchesSearch = 
                invoice.invoiceNumber.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()) ||
                invoice.customerName.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()) ||
                (invoice.cusdecNumber && invoice.cusdecNumber.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()));
              
              const matchesStatus = oldInvoiceFilterStatus === 'All' || invoice.status === oldInvoiceFilterStatus;
              
              return matchesSearch && matchesStatus;
            }).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <p>{oldInvoices.length === 0 ? 'No old invoices found' : 'No old invoices match the selected filters'}</p>
              </div>
            ) : (
              <div className="billing-table-wrapper">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Customer</th>
                      <th>Cusdec Number</th>
                      <th>Invoice Date</th>
                      <th>Total Amount</th>
                      <th>Amount Received</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th className="expand-header"></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oldInvoices.filter(invoice => {
                      const matchesSearch = 
                        invoice.invoiceNumber.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()) ||
                        invoice.customerName.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()) ||
                        (invoice.cusdecNumber && invoice.cusdecNumber.toLowerCase().includes(oldInvoiceSearchTerm.toLowerCase()));
                      
                      const matchesStatus = oldInvoiceFilterStatus === 'All' || invoice.status === oldInvoiceFilterStatus;
                      
                      return matchesSearch && matchesStatus;
                    }).map(invoice => (
                      <React.Fragment key={invoice.oldInvoiceId}>
                        <tr className={expandedOldInvoiceRow === invoice.oldInvoiceId ? 'expanded' : ''}>
                          <td data-label="Invoice Number"><strong>{invoice.invoiceNumber}</strong></td>
                          <td data-label="Customer">{invoice.customerName}</td>
                          <td data-label="Cusdec Number">{invoice.cusdecNumber || '-'}</td>
                          <td data-label="Invoice Date">{new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</td>
                          <td data-label="Total Amount" className="amount">LKR {formatAmount(invoice.totalAmount)}</td>
                          <td data-label="Amount Received" className="amount">LKR {formatAmount(invoice.amountReceived)}</td>
                          <td data-label="Balance" className="amount">LKR {formatAmount(invoice.balance)}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${invoice.status.toLowerCase().replace(' ', '-')}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="expand-column">
                            <button
                              className="expand-btn-middle"
                              onClick={() => setExpandedOldInvoiceRow(expandedOldInvoiceRow === invoice.oldInvoiceId ? null : invoice.oldInvoiceId)}
                              title={expandedOldInvoiceRow === invoice.oldInvoiceId ? "Hide details" : "View details"}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points={expandedOldInvoiceRow === invoice.oldInvoiceId ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                              </svg>
                            </button>
                          </td>
                          <td data-label="Actions">
                            <div className="action-buttons">
                              {invoice.balance > 0 && user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive') && (
                                <button 
                                  className="btn btn-primary btn-small"
                                  onClick={() => {
                                    setSelectedOldInvoice(invoice);
                                    setOldInvoicePaymentData({
                                      paymentAmount: '',
                                      paymentMethod: 'Cash',
                                      receivedDate: new Date().toISOString().split('T')[0],
                                      notes: '',
                                      chequeNumber: '',
                                      chequeDate: '',
                                      chequeAmount: '',
                                      bankName: ''
                                    });
                                    setShowOldPaymentModal(true);
                                  }}
                                  title="Add Payment"
                                >
                                  + Payment
                                </button>
                              )}
                              {user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive') && (
                                <>
                                  <button 
                                    className="btn btn-secondary btn-small"
                                    onClick={() => {
                                      const invoiceParts = invoice.invoiceNumber.split(' - INV');
                                      const suffix = invoiceParts[1] || '';
                                      
                                      setEditingOldInvoice(invoice);
                                      setOldInvoiceFormData({
                                        customerId: invoice.customerId,
                                        cusdecNumber: invoice.cusdecNumber || '',
                                        cusdecDate: invoice.cusdecDate ? invoice.cusdecDate.split('T')[0] : '',
                                        invoiceDate: invoice.invoiceDate.split('T')[0],
                                        invoiceNumberSuffix: suffix,
                                        totalAmount: invoice.totalAmount,
                                        settleDate: invoice.settleDate ? invoice.settleDate.split('T')[0] : ''
                                      });
                                      setShowOldInvoiceModal(true);
                                    }}
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-small"
                                    onClick={async () => {
                                      if (!window.confirm('Are you sure you want to delete this invoice?')) return;
                                      try {
                                        const response = await fetch(`${API_BASE}/api/old-invoices/${invoice.oldInvoiceId}`, {
                                          method: 'DELETE',
                                          headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                                          }
                                        });
                                        if (response.ok) {
                                          setMessage('Invoice deleted successfully');
                                          fetchOldInvoices();
                                        } else {
                                          setMessage('Failed to delete invoice');
                                        }
                                      } catch (error) {
                                        console.error('Error deleting invoice:', error);
                                        setMessage('Failed to delete invoice');
                                      }
                                    }}
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedOldInvoiceRow === invoice.oldInvoiceId && (
                          <tr className="details-row">
                            <td colSpan="10">
                              <div className="bill-details-expanded">
                                <div className="details-grid">
                                  <div className="detail-card">
                                    <div className="detail-label">Customer ID</div>
                                    <div className="detail-value">{invoice.customerId}</div>
                                  </div>
                                  <div className="detail-card">
                                    <div className="detail-label">Cusdec Date</div>
                                    <div className="detail-value">{invoice.cusdecDate ? new Date(invoice.cusdecDate).toLocaleDateString('en-GB') : '-'}</div>
                                  </div>
                                  <div className="detail-card">
                                    <div className="detail-label">Settle Date</div>
                                    <div className="detail-value">{invoice.settleDate ? new Date(invoice.settleDate).toLocaleDateString('en-GB') : '-'}</div>
                                  </div>
                                  <div className="detail-card">
                                    <div className="detail-label">Created</div>
                                    <div className="detail-value">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : '-'}</div>
                                  </div>
                                </div>

                                {invoice.payments && invoice.payments.length > 0 && (
                                  <div className="payment-tracking-section">
                                    <div className="payment-tracking-header">
                                      <span className="payment-tracking-title">Payment History</span>
                                      <span className="payment-tracking-count">{invoice.payments.length} payment record{invoice.payments.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    
                                    <div className="payment-tracking-table">
                                      <div className="payment-table-header">
                                        <div className="payment-header-cell payment-date-col">#</div>
                                        <div className="payment-header-cell payment-date-col">Payment Date</div>
                                        <div className="payment-header-cell payment-method-col">Method</div>
                                        <div className="payment-header-cell payment-reference-col">Reference</div>
                                        <div className="payment-header-cell payment-amount-col">Amount Paid</div>
                                        {user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive') && (
                                          <div className="payment-header-cell payment-amount-col">Actions</div>
                                        )}
                                      </div>
                                      
                                      <div className="payment-table-body">
                                        {invoice.payments.map((payment, idx) => (
                                          <div key={idx} className="payment-table-row">
                                            <div className="payment-table-cell payment-date-col">
                                              <span className="payment-num">{idx + 1}</span>
                                            </div>
                                            <div className="payment-table-cell payment-date-col">
                                              {new Date(payment.receivedDate).toLocaleDateString('en-GB')}
                                            </div>
                                            <div className="payment-table-cell payment-method-col">
                                              <span className={`payment-method-badge payment-method-${payment.paymentMethod?.toLowerCase().replace(' ', '-')}`}>
                                                {payment.paymentMethod === 'Cash' && '💵'}
                                                {payment.paymentMethod === 'Cheque' && '📝'}
                                                {payment.paymentMethod === 'Bank Transfer' && '🏦'}
                                                {' '}{payment.paymentMethod || '-'}
                                              </span>
                                            </div>
                                            <div className="payment-table-cell payment-reference-col">
                                              {payment.paymentMethod === 'Cheque' && payment.chequeNumber ? (
                                                <span className="reference-text">CHQ: {payment.chequeNumber}</span>
                                              ) : payment.paymentMethod === 'Bank Transfer' && payment.bankName ? (
                                                <span className="reference-text">{payment.bankName}</span>
                                              ) : payment.paymentMethod === 'Cash' ? (
                                                <span className="reference-text">Cash</span>
                                              ) : (
                                                <span className="reference-empty">-</span>
                                              )}
                                            </div>
                                            <div className="payment-table-cell payment-amount-col">
                                              <span className="payment-amount-value">LKR {formatAmount(payment.paymentAmount || 0)}</span>
                                            </div>
                                            {user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive') && (
                                              <div className="payment-table-cell payment-amount-col">
                                                <button 
                                                  className="btn btn-danger btn-small"
                                                  onClick={async () => {
                                                    if (!window.confirm('Are you sure you want to delete this payment?')) return;
                                                    try {
                                                      const response = await fetch(`${API_BASE}/api/old-invoices/payments/${payment.paymentId}`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                        }
                                                      });
                                                      if (response.ok) {
                                                        setMessage('Payment deleted successfully');
                                                        fetchOldInvoices();
                                                      } else {
                                                        setMessage('Failed to delete payment');
                                                      }
                                                    } catch (error) {
                                                      console.error('Error deleting payment:', error);
                                                      setMessage('Failed to delete payment');
                                                    }
                                                  }}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
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
          </>
        )}
      </div>

      {/* Old Invoice Add/Edit Modal */}
      {showOldInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingOldInvoice ? 'Edit Old Invoice' : 'Add Old Invoice'}</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowOldInvoiceModal(false);
                  setEditingOldInvoice(null);
                  setOldInvoiceFormData({
                    customerId: '',
                    cusdecNumber: '',
                    cusdecDate: '',
                    invoiceDate: '',
                    invoiceNumberSuffix: '',
                    totalAmount: '',
                    settleDate: ''
                  });
                  setOldInvoiceFormErrors({});
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              const errors = {};
              if (!oldInvoiceFormData.customerId) errors.customerId = 'Customer is required';
              if (!oldInvoiceFormData.invoiceDate) errors.invoiceDate = 'Invoice date is required';
              if (!oldInvoiceFormData.invoiceNumberSuffix) errors.invoiceNumberSuffix = 'Invoice number suffix is required';
              if (!oldInvoiceFormData.totalAmount || parseFloat(oldInvoiceFormData.totalAmount) <= 0) {
                errors.totalAmount = 'Total amount must be greater than 0';
              }
              
              if (Object.keys(errors).length > 0) {
                setOldInvoiceFormErrors(errors);
                setMessage('Please fix the errors in the form');
                return;
              }

              try {
                const invoiceNumber = `${new Date(oldInvoiceFormData.invoiceDate).getFullYear()}/${String(new Date(oldInvoiceFormData.invoiceDate).getMonth() + 1).padStart(2, '0')} - INV${oldInvoiceFormData.invoiceNumberSuffix}`;
                const totalAmount = parseFloat(oldInvoiceFormData.totalAmount);
                const balance = totalAmount;
                
                const payload = {
                  customerId: oldInvoiceFormData.customerId,
                  cusdecNumber: oldInvoiceFormData.cusdecNumber || null,
                  cusdecDate: oldInvoiceFormData.cusdecDate || null,
                  invoiceDate: oldInvoiceFormData.invoiceDate,
                  invoiceNumber: invoiceNumber,
                  totalAmount: totalAmount,
                  amountReceived: 0,
                  balance: balance,
                  status: 'Pending',
                  settleDate: oldInvoiceFormData.settleDate || null,
                  daysAfterInvoice: null
                };

                const url = editingOldInvoice
                  ? `${API_BASE}/api/old-invoices/${editingOldInvoice.oldInvoiceId}`
                  : `${API_BASE}/api/old-invoices`;
                
                const method = editingOldInvoice ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(payload)
                });

                if (response.ok) {
                  setMessage(editingOldInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
                  fetchOldInvoices();
                  setShowOldInvoiceModal(false);
                  setEditingOldInvoice(null);
                  setOldInvoiceFormData({
                    customerId: '',
                    cusdecNumber: '',
                    cusdecDate: '',
                    invoiceDate: '',
                    invoiceNumberSuffix: '',
                    totalAmount: '',
                    settleDate: ''
                  });
                  setOldInvoiceFormErrors({});
                } else {
                  const error = await response.json();
                  setMessage(error.message || 'Failed to save invoice');
                }
              } catch (error) {
                console.error('Error saving invoice:', error);
                setMessage('Failed to save invoice');
              }
            }} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer *</label>
                  <select
                    value={oldInvoiceFormData.customerId}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, customerId: e.target.value})}
                    className={oldInvoiceFormErrors.customerId ? 'error' : ''}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.customerId} value={customer.customerId}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {oldInvoiceFormErrors.customerId && <span className="error-text">{oldInvoiceFormErrors.customerId}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cusdec Number</label>
                  <input
                    type="text"
                    value={oldInvoiceFormData.cusdecNumber}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, cusdecNumber: e.target.value})}
                    placeholder="Enter cusdec number"
                  />
                </div>
                <div className="form-group">
                  <label>Cusdec Date</label>
                  <input
                    type="date"
                    value={oldInvoiceFormData.cusdecDate}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, cusdecDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Invoice Date *</label>
                  <input
                    type="date"
                    value={oldInvoiceFormData.invoiceDate}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, invoiceDate: e.target.value})}
                    className={oldInvoiceFormErrors.invoiceDate ? 'error' : ''}
                    required
                  />
                  {oldInvoiceFormErrors.invoiceDate && <span className="error-text">{oldInvoiceFormErrors.invoiceDate}</span>}
                </div>
                <div className="form-group">
                  <label>Invoice Number Suffix *</label>
                  <input
                    type="text"
                    value={oldInvoiceFormData.invoiceNumberSuffix}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, invoiceNumberSuffix: e.target.value})}
                    placeholder="e.g., 11959"
                    className={oldInvoiceFormErrors.invoiceNumberSuffix ? 'error' : ''}
                    required
                  />
                  {oldInvoiceFormErrors.invoiceNumberSuffix && <span className="error-text">{oldInvoiceFormErrors.invoiceNumberSuffix}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Amount (LKR) *</label>
                  <input
                    type="text"
                    value={oldInvoiceFormData.totalAmount}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, totalAmount: e.target.value.replace(/,/g, '')})}
                    placeholder="0.00"
                    className={oldInvoiceFormErrors.totalAmount ? 'error' : ''}
                    required
                  />
                  {oldInvoiceFormErrors.totalAmount && <span className="error-text">{oldInvoiceFormErrors.totalAmount}</span>}
                </div>
                <div className="form-group">
                  <label>Settle Date (if fully settled)</label>
                  <input
                    type="date"
                    value={oldInvoiceFormData.settleDate}
                    onChange={(e) => setOldInvoiceFormData({...oldInvoiceFormData, settleDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowOldInvoiceModal(false);
                  setEditingOldInvoice(null);
                  setOldInvoiceFormData({
                    customerId: '',
                    cusdecNumber: '',
                    cusdecDate: '',
                    invoiceDate: '',
                    invoiceNumberSuffix: '',
                    totalAmount: '',
                    settleDate: ''
                  });
                  setOldInvoiceFormErrors({});
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOldInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Old Invoice Payment Modal */}
      {showOldPaymentModal && selectedOldInvoice && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h2>Add Payment</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowOldPaymentModal(false);
                  setSelectedOldInvoice(null);
                  setOldInvoicePaymentData({
                    paymentAmount: '',
                    paymentMethod: 'Cash',
                    receivedDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    chequeNumber: '',
                    chequeDate: '',
                    chequeAmount: '',
                    bankName: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="payment-info">
              <p><strong>Invoice:</strong> {selectedOldInvoice.invoiceNumber}</p>
              <p><strong>Customer:</strong> {selectedOldInvoice.customerName}</p>
              <p><strong>Balance:</strong> LKR {formatAmount(selectedOldInvoice.balance)}</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (!oldInvoicePaymentData.paymentAmount || parseFloat(oldInvoicePaymentData.paymentAmount) <= 0) {
                setMessage('Payment amount must be greater than 0');
                return;
              }

              if (oldInvoicePaymentData.paymentMethod === 'Cheque') {
                if (!oldInvoicePaymentData.chequeNumber) {
                  setMessage('Cheque number is required for cheque payments');
                  return;
                }
                if (!oldInvoicePaymentData.chequeDate) {
                  setMessage('Cheque date is required for cheque payments');
                  return;
                }
                if (!oldInvoicePaymentData.chequeAmount || parseFloat(oldInvoicePaymentData.chequeAmount) <= 0) {
                  setMessage('Cheque amount must be greater than 0');
                  return;
                }
              }

              if (oldInvoicePaymentData.paymentMethod === 'Bank Transfer') {
                if (!oldInvoicePaymentData.bankName) {
                  setMessage('Bank name is required for bank transfer payments');
                  return;
                }
              }

              try {
                const payload = {
                  paymentAmount: parseFloat(oldInvoicePaymentData.paymentAmount),
                  paymentMethod: oldInvoicePaymentData.paymentMethod,
                  receivedDate: oldInvoicePaymentData.receivedDate,
                  notes: oldInvoicePaymentData.notes
                };

                if (oldInvoicePaymentData.paymentMethod === 'Cheque') {
                  payload.chequeNumber = oldInvoicePaymentData.chequeNumber;
                  payload.chequeDate = oldInvoicePaymentData.chequeDate;
                  payload.chequeAmount = parseFloat(oldInvoicePaymentData.chequeAmount);
                }

                if (oldInvoicePaymentData.paymentMethod === 'Bank Transfer') {
                  payload.bankName = oldInvoicePaymentData.bankName;
                }

                const response = await fetch(`${API_BASE}/api/old-invoices/${selectedOldInvoice.oldInvoiceId}/payments`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(payload)
                });

                if (response.ok) {
                  setMessage('Payment added successfully');
                  fetchOldInvoices();
                  setShowOldPaymentModal(false);
                  setSelectedOldInvoice(null);
                  setOldInvoicePaymentData({
                    paymentAmount: '',
                    paymentMethod: 'Cash',
                    receivedDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    chequeNumber: '',
                    chequeDate: '',
                    chequeAmount: '',
                    bankName: ''
                  });
                } else {
                  const error = await response.json();
                  setMessage(error.message || 'Failed to add payment');
                }
              } catch (error) {
                console.error('Error adding payment:', error);
                setMessage('Failed to add payment');
              }
            }} className="modal-form">
              <div className="form-group">
                <label>Payment Amount (LKR) *</label>
                <input
                  type="text"
                  value={oldInvoicePaymentData.paymentAmount}
                  onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, paymentAmount: e.target.value.replace(/,/g, '')})}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={oldInvoicePaymentData.paymentMethod}
                  onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, paymentMethod: e.target.value})}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {oldInvoicePaymentData.paymentMethod === 'Cheque' && (
                <>
                  <div className="form-group">
                    <label>Cheque Number *</label>
                    <input
                      type="text"
                      value={oldInvoicePaymentData.chequeNumber}
                      onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, chequeNumber: e.target.value})}
                      placeholder="Enter cheque number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cheque Date *</label>
                    <input
                      type="date"
                      value={oldInvoicePaymentData.chequeDate}
                      onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, chequeDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cheque Amount (LKR) *</label>
                    <input
                      type="text"
                      value={oldInvoicePaymentData.chequeAmount}
                      onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, chequeAmount: e.target.value.replace(/,/g, '')})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </>
              )}

              {oldInvoicePaymentData.paymentMethod === 'Bank Transfer' && (
                <div className="form-group">
                  <label>Bank Name *</label>
                  <select
                    value={oldInvoicePaymentData.bankName}
                    onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, bankName: e.target.value})}
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="Commercial Bank">Commercial Bank</option>
                    <option value="Peoples Bank">Peoples Bank</option>
                    <option value="Bank of Ceylon">Bank of Ceylon</option>
                    <option value="Hatton National Bank">Hatton National Bank</option>
                    <option value="Sampath Bank">Sampath Bank</option>
                    <option value="Nations Trust Bank">Nations Trust Bank</option>
                    <option value="DFCC Bank">DFCC Bank</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Received Date *</label>
                <input
                  type="date"
                  value={oldInvoicePaymentData.receivedDate}
                  onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, receivedDate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={oldInvoicePaymentData.notes}
                  onChange={(e) => setOldInvoicePaymentData({...oldInvoicePaymentData, notes: e.target.value})}
                  placeholder="Optional notes"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowOldPaymentModal(false);
                  setSelectedOldInvoice(null);
                  setOldInvoicePaymentData({
                    paymentAmount: '',
                    paymentMethod: 'Cash',
                    receivedDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    chequeNumber: '',
                    chequeDate: '',
                    chequeAmount: '',
                    bankName: ''
                  });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Billing;

