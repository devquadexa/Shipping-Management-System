import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { transporterService } from '../api/services/transporterService';
import { jobService } from '../api/services/jobService';
import { billingService } from '../api/services/billingService';
import { formatDate, formatDateWithMonth } from '../utils/dateFormatter';
import '../styles/Transporters.css';

const initialFormData = {
  name: '',
  mainPhone: '',
  email: '',
  lorryNumber: '',
  registrationDate: new Date().toISOString().split('T')[0],
  addressNumber: '',
  addressStreet1: '',
  addressStreet2: '',
  addressDistrict: '',
  addressCity: '',
  addressCountry: 'Sri Lanka',
  contactPersons: [{ name: '', phone: '', email: '' }],
  transporterType: 'Non FCL',
  driverName: '',
  size: '',
  isActive: true,
};

function Transporters() {
  const { user } = useAuth();
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [transporters, setTransporters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [bills, setBills] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentMode, setPaymentMode] = useState('full');
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeAmount, setChequeAmount] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank');
  const [expandedPaymentDetails, setExpandedPaymentDetails] = useState(null);
  const [selectedChequeId, setSelectedChequeId] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const canViewTransporters = user && (
    user.role === 'Admin' ||
    user.role === 'Super Admin' ||
    user.role === 'Manager' ||
    user.role === 'Office Executive'
  );
  const canManageTransporters = user && (
    user.role === 'Admin' ||
    user.role === 'Super Admin' ||
    user.role === 'Manager'
  );
  const canPayTransporterCosts = user && (
    user.role === 'Admin' ||
    user.role === 'Super Admin' ||
    user.role === 'Manager'
  );

  useEffect(() => {
    if (canViewTransporters) {
      fetchTransporters();
      fetchJobs();
      fetchBills();
      fetchDistricts();
      fetchAllCities();
    }
  }, [canViewTransporters]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const fetchTransporters = async () => {
    try {
      const data = await transporterService.getAll();
      setTransporters(data);
    } catch (error) {
      console.error('Error fetching transporters:', error);
      setMessage(error.response?.data?.message || 'Error loading transporters');
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  const fetchBills = async () => {
    try {
      const data = await billingService.getBills();
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setBills([]);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await apiClient.get('/locations/districts');
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchAllCities = async () => {
    try {
      const response = await apiClient.get('/locations/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  const getFilteredCities = (districtName) => {
    const matchedDistrict = districts.find((district) => district.districtName === districtName);
    if (!matchedDistrict) {
      return [];
    }

    return cities.filter((city) => city.districtId === matchedDistrict.districtId);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTransporter(null);
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setFilteredCities([]);
    setShowModal(true);
  };

  const openEditModal = (transporter) => {
    setFilteredCities(getFilteredCities(transporter.addressDistrict || ''));
    setEditingTransporter(transporter);
    setFormData({
      name: transporter.name || '',
      mainPhone: transporter.mainPhone || transporter.phone || '',
      email: transporter.email || '',
      lorryNumber: transporter.lorryNumber || '',
      registrationDate: transporter.registrationDate
        ? new Date(transporter.registrationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      addressNumber: transporter.addressNumber || '',
      addressStreet1: transporter.addressStreet1 || '',
      addressStreet2: transporter.addressStreet2 || '',
      addressDistrict: transporter.addressDistrict || '',
      addressCity: transporter.addressCity || '',
      addressCountry: transporter.addressCountry || 'Sri Lanka',
      contactPersons:
        transporter.contactPersons && transporter.contactPersons.length > 0
          ? transporter.contactPersons.map((contactPerson) => ({
              name: contactPerson.name || '',
              phone: contactPerson.phone || '',
              email: contactPerson.email || '',
            }))
          : [{ name: transporter.contactPerson || '', phone: '', email: '' }],
      transporterType: transporter.transporterType || 'Non FCL',
      driverName: transporter.driverName || '',
      size: transporter.size || '',
      isActive: transporter.isActive,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Transporter name is required';
    } else if (!/^[a-zA-Z\s-]+$/.test(formData.name.trim())) {
      errors.name = 'Transporter name can only contain letters, spaces, and hyphens (-)';
    }

    if (!formData.mainPhone.trim()) {
      errors.mainPhone = 'Main phone number is required';
    } else if (!/^\d{10}$/.test(formData.mainPhone.replace(/\s/g, ''))) {
      errors.mainPhone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.lorryNumber.trim()) {
      errors.lorryNumber = 'Lorry number is required';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.addressNumber.trim()) {
      errors.addressNumber = 'Address number is required';
    }

    if (!formData.addressStreet1.trim()) {
      errors.addressStreet1 = 'Street name 1 is required';
    }

    if (!formData.addressDistrict.trim()) {
      errors.addressDistrict = 'District is required';
    }

    if (!formData.addressCity.trim()) {
      errors.addressCity = 'City/Town is required';
    }

    if (!formData.addressCountry.trim()) {
      errors.addressCountry = 'Country is required';
    }

    // FCL-specific validations
    if (formData.transporterType === 'FCL') {
      if (!formData.driverName.trim()) {
        errors.driverName = 'Driver name is required for FCL transporters';
      } else if (!/^[a-zA-Z\s-]+$/.test(formData.driverName.trim())) {
        errors.driverName = 'Driver name can only contain letters, spaces, and hyphens (-)';
      }

      if (!formData.size.trim()) {
        errors.size = 'Size is required for FCL transporters';
      }
    }

    const validContactPersons = formData.contactPersons.filter(
      (contactPerson) => contactPerson.name.trim() || contactPerson.phone.trim() || contactPerson.email.trim()
    );

    if (validContactPersons.length === 0) {
      errors.contactPersons = 'At least one contact person is required';
    }

    if (validContactPersons.length > 2) {
      errors.contactPersons = 'Maximum 2 contact persons allowed';
    }

    validContactPersons.forEach((contactPerson, index) => {
      if (!contactPerson.name.trim()) {
        errors[`contactPersonName${index}`] = 'Contact person name is required';
        } else if (!/^[a-zA-Z\s-]+$/.test(contactPerson.name.trim())) {
          errors[`contactPersonName${index}`] = 'Name can only contain letters, spaces, and hyphens (-)';
      }

      if (!contactPerson.phone.trim()) {
        errors[`contactPersonPhone${index}`] = 'Contact person phone is required';
      } else if (!/^\d{10}$/.test(contactPerson.phone.replace(/\s/g, ''))) {
        errors[`contactPersonPhone${index}`] = 'Phone number must be exactly 10 digits';
      }

      if (contactPerson.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactPerson.email)) {
        errors[`contactPersonEmail${index}`] = 'Please enter a valid email address';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'name') {
      const sanitizedName = value.replace(/[^a-zA-Z\s-]/g, '');
      setFormData((prev) => ({
        ...prev,
        name: sanitizedName,
      }));
      if (formErrors.name) {
        setFormErrors((prev) => ({ ...prev, name: '' }));
      }
      return;
    }

    if (name === 'mainPhone') {
      const sanitizedPhone = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        mainPhone: sanitizedPhone,
      }));
      if (formErrors.mainPhone) {
        setFormErrors((prev) => ({ ...prev, mainPhone: '' }));
      }
      return;
    }

    if (name === 'driverName') {
      const sanitizedName = value.replace(/[^a-zA-Z\s-]/g, '');
      setFormData((prev) => ({
        ...prev,
        driverName: sanitizedName,
      }));
      if (formErrors.driverName) {
        setFormErrors((prev) => ({ ...prev, driverName: '' }));
      }
      return;
    }

    if (name === 'addressDistrict') {
      setFilteredCities(getFilteredCities(value));
      setFormData((prev) => ({
        ...prev,
        addressDistrict: value,
        addressCity: '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContactPersonChange = (index, field, value) => {
    let sanitizedValue = value;
    if (field === 'name') {
      sanitizedValue = value.replace(/[^a-zA-Z\s-]/g, '');
    } else if (field === 'phone') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      contactPersons: prev.contactPersons.map((contactPerson, contactPersonIndex) =>
        contactPersonIndex === index ? { ...contactPerson, [field]: sanitizedValue } : contactPerson
      ),
    }));

    const errorKey = field === 'name' ? `contactPersonName${index}` : field === 'phone' ? `contactPersonPhone${index}` : '';
    if (errorKey && formErrors[errorKey]) {
      setFormErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  const validateNameInput = (event) => {
    const { key } = event;
    if (key.length > 1) {
      return true;
    }
    if (!/^[a-zA-Z\s-]$/.test(key)) {
      event.preventDefault();
      return false;
    }
    return true;
  };

  const validatePhoneInput = (event) => {
    const { key } = event;
    if (key.length > 1) {
      return true;
    }
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return false;
    }
    return true;
  };

  const addContactPerson = () => {
    if (formData.contactPersons.length >= 2) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      contactPersons: [...prev.contactPersons, { name: '', phone: '', email: '' }],
    }));
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length === 1) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((_, contactPersonIndex) => contactPersonIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      if (editingTransporter) {
        await transporterService.update(editingTransporter.transporterId, formData);
        setMessage('Transporter updated successfully');
      } else {
        await transporterService.create(formData);
        setMessage('Transporter created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchTransporters();
    } catch (error) {
      console.error('Error saving transporter:', error);
      setMessage(error.response?.data?.message || 'Error saving transporter');
    }
  };

  const handleDeactivate = async (transporterId) => {
    if (!window.confirm('Are you sure you want to deactivate this transporter?')) {
      return;
    }

    try {
      await transporterService.delete(transporterId);
      setMessage('Transporter deactivated successfully');
      setExpandedRow(null);
      fetchTransporters();
    } catch (error) {
      console.error('Error deactivating transporter:', error);
      setMessage(error.response?.data?.message || 'Error deactivating transporter');
    }
  };

  const filteredTransporters = transporters.filter((transporter) => {
    const isActive = transporter.isActive === undefined || transporter.isActive === null
      ? true
      : Boolean(transporter.isActive);

    if (!isActive) {
      return false;
    }

    const haystack = [
      transporter.transporterId,
      transporter.name,
      transporter.contactPerson,
      transporter.mainPhone || transporter.phone,
      transporter.email,
      transporter.registrationDate,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  const getAssignedJobs = (transporter) => {
    const transporterName = (transporter?.name || '').trim().toLowerCase();
    const transporterId = (transporter?.transporterId || '').trim().toLowerCase();

    return jobs.filter((job) => {
      const jobTransporter = (job?.transporter || '').trim().toLowerCase();
      const jobTransporterId = (job?.transporterId || '').trim().toLowerCase();

      if (transporterId && jobTransporterId && jobTransporterId === transporterId) {
        return true;
      }

      if (transporterName && jobTransporter && jobTransporter === transporterName) {
        return true;
      }

      return false;
    });
  };

  const getJobPaymentStatus = (jobId) => {
    if (!jobId) return 'Not Billed';

    const jobBills = bills.filter((bill) => bill.jobId === jobId);
    if (jobBills.length === 0) {
      return 'Not Billed';
    }

    const latestBill = [...jobBills].sort((a, b) => {
      const aDate = new Date(a.billDate || a.createdDate || 0).getTime();
      const bDate = new Date(b.billDate || b.createdDate || 0).getTime();
      return bDate - aDate;
    })[0];

    return latestBill.paymentStatus || 'Not Billed';
  };

  const getBillingAmount = (jobId) => {
    if (!jobId) return 0;

    // Find the job with this ID
    const job = jobs.find(j => j.jobId === jobId);
    if (!job || !job.payItems) return 0;

    // Get only transporter cost billing amount from job's pay items
    const payItems = Array.isArray(job.payItems) ? job.payItems : [];
    const transporterCostItems = payItems.filter((item) => {
      const label = (item?.description || item?.name || '').toLowerCase().trim();
      // Only check for new format with place names
      return label.startsWith('transporter cost (from');
    });

    if (!transporterCostItems.length) return 0;

    return transporterCostItems.reduce((sum, item) => {
      return sum + (parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0);
    }, 0);
  };

  const getPaymentStatusClassName = (status) => {
    return String(status || 'Not Billed').toLowerCase().replace(/\s+/g, '-');
  };

  const getTransporterCostItems = (job) => {
    const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
    return payItems.filter((item) => {
      const label = (item?.description || item?.name || '').toLowerCase().trim();
      // Only check for new format with place names
      return label.startsWith('transporter cost (from');
    });
  };

  const getTransporterCostAmount = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return 0;

    return transporterCostItems.reduce((sum, item) => {
      return sum + (parseFloat(item.actualCost || item.amount || 0) || 0);
    }, 0);
  };

  const isTransporterCostPaid = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return false;

    return transporterCostItems.every((item) => {
      const totalAmount = parseFloat(item.actualCost || item.amount || item.billingAmount || 0) || 0;
      const paidAmount = parseFloat(item.paidAmount || 0) || 0;
      return totalAmount > 0 && paidAmount >= totalAmount;
    });
  };

  const isTransporterCostPartiallyPaid = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return false;

    // Only partially paid if NOT fully paid AND has some payment
    return !isTransporterCostPaid(job) && transporterCostItems.some((item) => {
      const paidAmount = parseFloat(item.paidAmount || 0) || 0;
      return paidAmount > 0;
    });
  };

  const getPaidByLabel = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return '';

    const paidByLabels = [...new Set(
      transporterCostItems
        .map((item) => {
          const name = item.paidByName || item.paidBy || '';
          const method = item.paymentMethod || '';
          if (name && method) return `${name} (${method})`;
          return name;
        })
        .filter(Boolean)
    )];

    return paidByLabels.join(', ');
  };

  const getPaymentDetails = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return null;
    return transporterCostItems[0];
  };

  const getRemainingTransporterCost = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return 0;

    let totalRemaining = 0;
    transporterCostItems.forEach((item) => {
      const totalAmount = parseFloat(item.actualCost || item.amount || 0) || 0;
      const paidAmount = parseFloat(item.paidAmount || 0) || 0;
      totalRemaining += Math.max(0, totalAmount - paidAmount);
    });
    return totalRemaining;
  };

  const getAllPaymentRecords = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return [];
    
    const item = transporterCostItems[0];
    
    // If paymentRecords array exists, return it
    if (Array.isArray(item.paymentRecords) && item.paymentRecords.length > 0) {
      return item.paymentRecords;
    }
    
    // Otherwise, create a single record from the item's payment data
    if (item.paidAmount > 0) {
      return [{
        paymentDate: item.paidAt,
        paymentMethod: item.paymentMethod,
        chequeNumber: item.chequeNumber,
        chequeDate: item.chequeDate,
        bankName: item.bankName,
        amount: item.paidAmount,
        paidByName: item.paidByName
      }];
    }
    
    return [];
  };

  const getAvailableChequesWithBalance = () => {
    const chequeMap = new Map();

    // Collect all cheques from all jobs
    jobs.forEach((job) => {
      const paymentRecords = getAllPaymentRecords(job);
      paymentRecords.forEach((payment) => {
        if (payment.paymentMethod === 'Cheque' && payment.chequeNumber) {
          const key = `${payment.chequeNumber}-${payment.chequeDate}`;
          if (!chequeMap.has(key)) {
            chequeMap.set(key, {
              chequeNumber: payment.chequeNumber,
              chequeDate: payment.chequeDate,
              chequeAmount: parseFloat(payment.chequeAmount || 0),
              bankName: payment.bankName,
              totalUsed: 0
            });
          }
        }
      });
    });

    // Calculate used amount for each cheque
    jobs.forEach((job) => {
      const paymentRecords = getAllPaymentRecords(job);
      paymentRecords.forEach((payment) => {
        if (payment.paymentMethod === 'Cheque' && payment.chequeNumber) {
          const key = `${payment.chequeNumber}-${payment.chequeDate}`;
          if (chequeMap.has(key)) {
            const cheque = chequeMap.get(key);
            cheque.totalUsed += parseFloat(payment.amount || 0);
          }
        }
      });
    });

    // Filter cheques with remaining balance
    const availableCheques = Array.from(chequeMap.values()).filter(
      (cheque) => cheque.chequeAmount > cheque.totalUsed
    );

    return availableCheques;
  };

  const calculateTransporterSummary = () => {
    const summary = {
      totalTransporters: transporters.filter(t => t.isActive).length,
      transportersWithJobs: new Set(),
      paidTransporters: new Set(),
      unpaidTransporters: new Set(),
      totalPaidAmount: 0,
      totalUnpaidAmount: 0,
    };

    jobs.forEach((job) => {
      const transporterName = (job?.transporter || '').trim().toLowerCase();
      const transporterId = (job?.transporterId || '').trim().toLowerCase();

      if (!transporterName && !transporterId) return;

      const matchingTransporter = transporters.find((t) => {
        const tName = (t?.name || '').trim().toLowerCase();
        const tId = (t?.transporterId || '').trim().toLowerCase();
        return (transporterId && tId === transporterId) || (transporterName && tName === transporterName);
      });

      if (!matchingTransporter) return;

      summary.transportersWithJobs.add(matchingTransporter.transporterId);

      const costAmount = getTransporterCostAmount(job);
      if (costAmount > 0) {
        if (isTransporterCostPaid(job)) {
          summary.paidTransporters.add(matchingTransporter.transporterId);
          summary.totalPaidAmount += costAmount;
        } else {
          summary.unpaidTransporters.add(matchingTransporter.transporterId);
          summary.totalUnpaidAmount += costAmount;
        }
      }
    });

    return {
      totalTransporters: summary.totalTransporters,
      transportersWithJobs: summary.transportersWithJobs.size,
      paidTransporters: summary.paidTransporters.size,
      unpaidTransporters: summary.unpaidTransporters.size,
      totalPaidAmount: summary.totalPaidAmount,
      totalUnpaidAmount: summary.totalUnpaidAmount,
    };
  };

  const openPaymentModal = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) {
      setMessage('Transporter cost not found for this job');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const amount = getTransporterCostAmount(job);
    if (amount <= 0) {
      setMessage('Transporter cost amount is not set yet');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSelectedJobForPayment(job);
    setPaymentMethod('Cash');
    setPaymentMode('full');
    setPartialPaymentAmount('');
    setChequeNumber('');
    setChequeDate('');
    setChequeAmount('');
    setBankName('Commercial Bank');
    setSelectedChequeId('');
    setShowPaymentModal(true);
  };

  const submitTransporterPayment = async () => {
    if (!selectedJobForPayment) return;

    // Validate payment amount
    let paymentAmount = 0;
    if (paymentMode === 'full') {
      paymentAmount = getRemainingTransporterCost(selectedJobForPayment);
    } else {
      paymentAmount = parseFloat(partialPaymentAmount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        setMessage('❌ Please enter a valid payment amount');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
    }

    if (paymentMethod === 'Cheque') {
      if (!chequeNumber || !chequeDate || !chequeAmount) {
        setMessage('❌ Please fill in all cheque details (Number, Date, Amount)');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
      if (isNaN(parseFloat(chequeAmount)) || parseFloat(chequeAmount) <= 0) {
        setMessage('❌ Please enter a valid cheque amount');
        setTimeout(() => setMessage(''), 5000);
        return;
      }
    }

    try {
      // Get the latest job data from the jobs array to ensure we have all existing payment records
      const latestJob = jobs.find(j => j.jobId === selectedJobForPayment.jobId) || selectedJobForPayment;
      
      const updatedPayItems = (Array.isArray(latestJob.payItems) ? latestJob.payItems : []).map((item) => {
        const label = (item?.description || item?.name || '').toLowerCase().trim();
        if (label !== 'transporter cost') return item;

        const itemAmount = parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0;
        const currentPaidAmount = parseFloat(item.paidAmount || 0) || 0;
        const totalPaidAmount = currentPaidAmount + paymentAmount;
        const isPaid = totalPaidAmount >= itemAmount;

        // Create new payment record
        const newPaymentRecord = {
          paymentDate: new Date().toISOString(),
          paymentMethod,
          amount: paymentAmount,
          paidByName: user?.name || user?.fullName || user?.username || user?.userId || 'System',
          ...(paymentMethod === 'Cheque' && { chequeNumber, chequeDate, chequeAmount: parseFloat(chequeAmount) }),
          ...(paymentMethod === 'Bank Transfer' && { bankName }),
        };

        // Get existing payment records or create new array
        const existingRecords = Array.isArray(item.paymentRecords) ? item.paymentRecords : [];
        const updatedRecords = [...existingRecords, newPaymentRecord];

        return {
          ...item,
          paymentStatus: isPaid ? 'Paid' : 'Partially Paid',
          isPaid: isPaid,
          paidAmount: totalPaidAmount,
          paidAt: new Date().toISOString(),
          paidBy: user?.userId || user?.username || user?.name || 'System',
          paidByName: user?.name || user?.fullName || user?.username || user?.userId || 'System',
          paymentMethod,
          paymentRecords: updatedRecords,
          ...(paymentMethod === 'Cheque' && { chequeNumber, chequeDate, chequeAmount: parseFloat(chequeAmount) }),
          ...(paymentMethod === 'Bank Transfer' && { bankName }),
        };
      });

      await jobService.replacePayItems(selectedJobForPayment.jobId, updatedPayItems);

      setJobs((prevJobs) => prevJobs.map((currentJob) => (
        currentJob.jobId === selectedJobForPayment.jobId ? { ...currentJob, payItems: updatedPayItems } : currentJob
      )));

      setShowPaymentModal(false);
      setSelectedJobForPayment(null);
      const paymentTypeText = paymentMode === 'full' ? 'Full payment' : `Partial payment (LKR ${formatAmount(paymentAmount)})`;
      setMessage(`✅ ${paymentTypeText} recorded for ${selectedJobForPayment.jobId} via ${paymentMethod}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Error paying transporter cost:', error);
      setMessage(error.response?.data?.message || '❌ Error recording payment');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!canViewTransporters) {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied</div>
      </div>
    );
  }

  return (
    <>
    <div className="container transporters-page">
      <div className="page-header">
        <div>
          <h1>Transporters</h1>
          <p>Manage transporter details and contact information</p>
        </div>
        {canManageTransporters && (
          <button onClick={openCreateModal} className="btn btn-primary">
            + New Transporter
          </button>
        )}
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {(() => {
        const summary = calculateTransporterSummary();
        return (
          <div className="summary-cards-container">
            <div className="summary-card">
              <div className="summary-card-icon">👥</div>
              <div className="summary-card-content">
                <div className="summary-card-label">Total Transporters</div>
                <div className="summary-card-value">{summary.totalTransporters}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon">📋</div>
              <div className="summary-card-content">
                <div className="summary-card-label">With Jobs</div>
                <div className="summary-card-value">{summary.transportersWithJobs}</div>
              </div>
            </div>
            <div className="summary-card paid">
              <div className="summary-card-icon">✅</div>
              <div className="summary-card-content">
                <div className="summary-card-label">Paid</div>
                <div className="summary-card-value">{summary.paidTransporters}</div>
                <div className="summary-card-amount">LKR {formatAmount(summary.totalPaidAmount)}</div>
              </div>
            </div>
            <div className="summary-card unpaid">
              <div className="summary-card-icon">⏳</div>
              <div className="summary-card-content">
                <div className="summary-card-label">Unpaid</div>
                <div className="summary-card-value">{summary.unpaidTransporters}</div>
                <div className="summary-card-amount">LKR {formatAmount(summary.totalUnpaidAmount)}</div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="card">
        <div className="card-header">
          <h2>All Transporters ({filteredTransporters.length})</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by transporter, contact, phone, email, or registration date..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {filteredTransporters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚚</div>
            <p>{searchTerm ? 'No transporters found matching your search' : 'No transporters added yet'}</p>
          </div>
        ) : (
          <div className="transporters-table-wrapper">
            <table className="transporters-table">
              <thead>
                <tr>
                  <th>Transporter ID</th>
                  <th>Name</th>
                  <th>Main Phone</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransporters.map((transporter) => (
                  (() => {
                    const assignedJobs = getAssignedJobs(transporter);
                    return (
                  <React.Fragment key={transporter.transporterId}>
                    <tr className={expandedRow === transporter.transporterId ? 'expanded' : ''}>
                      <td data-label="Transporter ID"><strong className="cell-value transporter-id">{transporter.transporterId}</strong></td>
                      <td data-label="Name"><span className="cell-value">{transporter.name}</span></td>
                      <td data-label="Main Phone"><span className="cell-value">{transporter.mainPhone || transporter.phone}</span></td>
                      <td data-label="Email"><span className="cell-value">{transporter.email || '-'}</span></td>
                      <td data-label="Registration Date">
                        <span className="cell-value">{formatDate(transporter.registrationDate)}</span>
                      </td>
                      <td data-label="Contact Person"><span className="cell-value">{transporter.contactPersons?.[0]?.name || transporter.contactPerson || '-'}</span></td>
                      <td data-label="Status">
                        <span className={`status-badge cell-value ${transporter.isActive ? 'status-active' : 'status-inactive'}`}>
                          {transporter.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="row-actions transporter-actions">
                          {canManageTransporters && (
                            <button
                              type="button"
                              className="btn-action btn-edit"
                              onClick={() => openEditModal(transporter)}
                              title="Edit Transporter"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action btn-view"
                            onClick={() => setExpandedRow(expandedRow === transporter.transporterId ? null : transporter.transporterId)}
                            title="View Details"
                          >
                            {expandedRow === transporter.transporterId ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === transporter.transporterId && (
                      <tr className="expanded-details">
                        <td colSpan="8">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4 className="section-title">Address Information</h4>
                              <div className="detail-item-block">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value-block">
                                  {[
                                    transporter.addressNumber,
                                    transporter.addressStreet1,
                                    transporter.addressStreet2,
                                    transporter.addressDistrict,
                                    transporter.addressCity,
                                    transporter.addressCountry || 'Sri Lanka',
                                  ]
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4 className="section-title">Contact Persons</h4>
                              {transporter.contactPersons && transporter.contactPersons.length > 0 ? (
                                <div className="contact-persons-list">
                                  {transporter.contactPersons.map((contactPerson, index) => (
                                    <div key={index} className="contact-person-card">
                                      <div className="contact-person-summary">
                                        <div className="contact-name">{contactPerson.name}</div>
                                        {contactPerson.designation && (
                                          <div className="contact-designation">{contactPerson.designation}</div>
                                        )}
                                      </div>
                                      <div className="contact-person-hover-details">
                                        <div className="contact-detail-row">
                                          <span className="detail-label-small">Phone:</span>
                                          <span className="detail-value-small">{contactPerson.phone || '-'}</span>
                                          <button
                                            className="btn-copy-small"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              if (!contactPerson.phone) {
                                                return;
                                              }
                                              navigator.clipboard.writeText(contactPerson.phone);
                                              setMessage('Phone number copied!');
                                              setTimeout(() => setMessage(''), 2000);
                                            }}
                                            title="Copy phone number"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                        {contactPerson.email && (
                                          <div className="contact-detail-row">
                                            <span className="detail-label-small">Email:</span>
                                            <span className="detail-value-small">{contactPerson.email}</span>
                                            <button
                                              className="btn-copy-small"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                navigator.clipboard.writeText(contactPerson.email);
                                                setMessage('Email copied!');
                                                setTimeout(() => setMessage(''), 2000);
                                              }}
                                              title="Copy email"
                                            >
                                              Copy
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="detail-value-block">No contact persons added</div>
                              )}
                            </div>

                            {canManageTransporters && (
                              <div className="detail-section">
                                <div className="detail-actions">
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeactivate(transporter.transporterId)}
                                    title="Deactivate Transporter"
                                  >
                                    Deactivate Transporter
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="detail-section assigned-jobs-section">
                              <div className="settlement-items-header">
                                <span className="settlement-items-title">Assigned Jobs</span>
                                <span className="settlement-items-count">{assignedJobs.length} job{assignedJobs.length !== 1 ? 's' : ''}</span>
                              </div>
                              {assignedJobs.length === 0 ? (
                                <div className="no-settlement-items">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                  <p>No jobs assigned to this transporter</p>
                                </div>
                              ) : (
                                <>
                                  <div className="date-range-filter">
                                    <div className="filter-group">
                                      <label>From Date:</label>
                                      <input
                                        type="date"
                                        value={dateRangeFilter.startDate}
                                        onChange={(e) => setDateRangeFilter({...dateRangeFilter, startDate: e.target.value})}
                                        className="filter-input"
                                      />
                                    </div>
                                    <div className="filter-group">
                                      <label>To Date:</label>
                                      <input
                                        type="date"
                                        value={dateRangeFilter.endDate}
                                        onChange={(e) => setDateRangeFilter({...dateRangeFilter, endDate: e.target.value})}
                                        className="filter-input"
                                      />
                                    </div>
                                    {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                                      <button
                                        onClick={() => setDateRangeFilter({startDate: '', endDate: ''})}
                                        className="btn-clear-filter"
                                      >
                                        Clear Filter
                                      </button>
                                    )}
                                  </div>
                                  <div className="settlement-review-table">
                                  <div className="settlement-table-header">
                                    <div className="settlement-header-cell settlement-num-col">#</div>
                                    <div className="settlement-header-cell settlement-name-col">Job ID</div>
                                    <div className="settlement-header-cell settlement-type-col">Category</div>
                                    <div className="settlement-header-cell settlement-type-col">Delivery Date</div>
                                    <div className="settlement-header-cell settlement-bill-col">Cost</div>
                                    <div className="settlement-header-cell settlement-bill-col">Billing Amount</div>
                                    <div className="settlement-header-cell settlement-bill-col">Paid Amount</div>
                                    <div className="settlement-header-cell settlement-bill-col">Balance</div>
                                    <div className="settlement-header-cell settlement-amount-col">Status</div>
                                    <div className="settlement-header-cell settlement-actions-col">Action</div>
                                  </div>
                                  <div className="settlement-table-body">
                                    {assignedJobs.filter((job) => {
                                      if (!dateRangeFilter.startDate && !dateRangeFilter.endDate) {
                                        return true;
                                      }
                                      
                                      const jobDate = job.transportDeliveryDate ? new Date(job.transportDeliveryDate) : null;
                                      if (!jobDate) return false;
                                      
                                      if (dateRangeFilter.startDate) {
                                        const startDate = new Date(dateRangeFilter.startDate);
                                        if (jobDate < startDate) return false;
                                      }
                                      
                                      if (dateRangeFilter.endDate) {
                                        const endDate = new Date(dateRangeFilter.endDate);
                                        endDate.setHours(23, 59, 59, 999);
                                        if (jobDate > endDate) return false;
                                      }
                                      
                                      return true;
                                    }).map((job, idx) => (
                                      <React.Fragment key={job.jobId}>
                                        <div className="settlement-table-row">
                                          <div className="settlement-table-cell settlement-num-col settlement-num">{idx + 1}</div>
                                          <div className="settlement-table-cell settlement-name-col">
                                            <span className="job-id-cell">
                                              {job.jobId || '-'}{job.cusdecNumber && ` / ${job.cusdecNumber}`}
                                            </span>
                                          </div>
                                          <div className="settlement-table-cell settlement-type-col">
                                            {job.shipmentCategory || '-'}
                                          </div>
                                          <div className="settlement-table-cell settlement-type-col">
                                            {formatDate(job.transportDeliveryDate)}
                                          </div>
                                          <div className="settlement-table-cell settlement-bill-col">
                                            {getTransporterCostAmount(job) > 0 ? (
                                              <span className="transporter-cost-amount">
                                                LKR {formatAmount(getTransporterCostAmount(job))}
                                              </span>
                                            ) : (
                                              <span className="transporter-no-cost">-</span>
                                            )}
                                          </div>
                                          <div className="settlement-table-cell settlement-bill-col">
                                            {getBillingAmount(job.jobId) > 0 ? (
                                              <span className="billing-amount">
                                                LKR {formatAmount(getBillingAmount(job.jobId))}
                                              </span>
                                            ) : (
                                              <span className="transporter-no-cost">-</span>
                                            )}
                                          </div>
                                          <div className="settlement-table-cell settlement-bill-col">
                                            {getPaymentDetails(job)?.paidAmount > 0 ? (
                                              <span className="paid-amount">
                                                LKR {formatAmount(getPaymentDetails(job)?.paidAmount || 0)}
                                              </span>
                                            ) : (
                                              <span className="transporter-no-cost">-</span>
                                            )}
                                          </div>
                                          <div className="settlement-table-cell settlement-bill-col">
                                            {getRemainingTransporterCost(job) > 0 ? (
                                              <span className="balance-amount">
                                                LKR {formatAmount(getRemainingTransporterCost(job))}
                                              </span>
                                            ) : (
                                              <span className="transporter-no-cost">-</span>
                                            )}
                                          </div>
                                          <div className="settlement-table-cell settlement-amount-col">
                                            {(() => {
                                              if (getTransporterCostAmount(job) > 0) {
                                                if (isTransporterCostPaid(job)) {
                                                  return <span className="transporter-paid-badge">Paid</span>;
                                                } else if (isTransporterCostPartiallyPaid(job)) {
                                                  return <span className="transporter-partial-badge">Partial</span>;
                                                } else {
                                                  return <span className="transporter-unpaid-badge">Unpaid</span>;
                                                }
                                              } else {
                                                return <span className="transporter-no-cost">-</span>;
                                              }
                                            })()}
                                          </div>
                                          <div className="settlement-table-cell settlement-actions-col">
                                            <div className="inline-action-btns">
                                              {getTransporterCostAmount(job) > 0 && canPayTransporterCosts && !isTransporterCostPaid(job) ? (
                                                <button
                                                  type="button"
                                                  className="inline-btn-edit"
                                                  onClick={() => openPaymentModal(job)}
                                                  title="Record payment"
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                              ) : null}
                                              {getTransporterCostAmount(job) > 0 && (
                                                <button
                                                  type="button"
                                                  className="inline-btn-delete"
                                                  onClick={() => setExpandedPaymentDetails(expandedPaymentDetails === job.jobId ? null : job.jobId)}
                                                  title={expandedPaymentDetails === job.jobId ? "Hide details" : "View details"}
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points={expandedPaymentDetails === job.jobId ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {expandedPaymentDetails === job.jobId && (
                                          <div className="settlement-table-row payment-details-expanded-row">
                                            <div className="settlement-table-cell" style={{gridColumn: '1 / -1'}}>
                                              <div className="payment-tracking-section">
                                                <div className="payment-tracking-header">
                                                  <span className="payment-tracking-title">Payment Breakdown</span>
                                                </div>
                                                
                                                <div className="payment-tracking-table">
                                                  <div className="payment-table-header">
                                                    <div className="payment-header-cell payment-label-col">Description</div>
                                                    <div className="payment-header-cell payment-amount-col">Amount</div>
                                                  </div>
                                                  
                                                  <div className="payment-table-body">
                                                    <div className="payment-table-row">
                                                      <div className="payment-table-cell payment-label-col">
                                                        <span className="payment-label">Total Amount</span>
                                                      </div>
                                                      <div className="payment-table-cell payment-amount-col">
                                                        <span className="payment-amount-value">LKR {formatAmount(getTransporterCostAmount(job))}</span>
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="payment-table-row">
                                                      <div className="payment-table-cell payment-label-col">
                                                        <span className="payment-label">Paid Amount</span>
                                                      </div>
                                                      <div className="payment-table-cell payment-amount-col">
                                                        <span className="payment-amount-value payment-amount-paid">LKR {formatAmount(getPaymentDetails(job)?.paidAmount || 0)}</span>
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="payment-table-row">
                                                      <div className="payment-table-cell payment-label-col">
                                                        <span className="payment-label">Remaining Amount</span>
                                                      </div>
                                                      <div className="payment-table-cell payment-amount-col">
                                                        <span className="payment-amount-value payment-amount-remaining">LKR {formatAmount(getRemainingTransporterCost(job))}</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                {getPaymentDetails(job)?.paidAmount > 0 && (
                                                  <div className="payment-tracking-table" style={{marginTop: '16px'}}>
                                                    <div className="payment-table-header">
                                                      <div className="payment-header-cell payment-date-col">Payment Date</div>
                                                      <div className="payment-header-cell payment-method-col">Method</div>
                                                      <div className="payment-header-cell payment-reference-col">Reference</div>
                                                      <div className="payment-header-cell payment-amount-col">Amount</div>
                                                      <div className="payment-header-cell payment-by-col">Paid By</div>
                                                    </div>
                                                    
                                                    <div className="payment-table-body">
                                                      {getAllPaymentRecords(job).map((payment, idx) => (
                                                        <div key={idx} className="payment-table-row">
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
                                                          <div className="payment-table-cell payment-by-col">
                                                            <span className="payment-by-value">{payment.paidByName || '-'}</span>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </React.Fragment>
                                    ))}
                                    <div className="settlement-table-row settlement-total-row">
                                      <div className="settlement-table-cell settlement-num-col"></div>
                                      <div className="settlement-table-cell settlement-name-col"><strong>Total</strong></div>
                                      <div className="settlement-table-cell settlement-type-col"></div>
                                      <div className="settlement-table-cell settlement-type-col"></div>
                                      <div className="settlement-table-cell settlement-bill-col settlement-amount-value">
                                        <strong>LKR {formatAmount(assignedJobs.reduce((sum, job) => sum + getTransporterCostAmount(job), 0))}</strong>
                                      </div>
                                      <div className="settlement-table-cell settlement-bill-col settlement-amount-value">
                                        <strong>LKR {formatAmount(assignedJobs.reduce((sum, job) => sum + getBillingAmount(job.jobId), 0))}</strong>
                                      </div>
                                      <div className="settlement-table-cell settlement-bill-col"></div>
                                      <div className="settlement-table-cell settlement-bill-col"></div>
                                      <div className="settlement-table-cell settlement-amount-col"></div>
                                      <div className="settlement-table-cell settlement-actions-col"></div>
                                    </div>
                                  </div>
                                </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>{editingTransporter ? 'Edit Transporter' : 'New Transporter'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="transporter-form">
              <div className="form-section">
                <h3 className="section-heading">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Transporter Name <span className="required">*</span></label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onKeyPress={validateNameInput}
                      placeholder="Enter name (letters, spaces, and hyphens only)"
                    />
                    {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Main Phone Number <span className="required">*</span></label>
                    <input
                      name="mainPhone"
                      value={formData.mainPhone}
                      onChange={handleChange}
                      onKeyPress={validatePhoneInput}
                      placeholder="0771234567"
                      maxLength="10"
                    />
                    {formErrors.mainPhone && <span className="form-error">{formErrors.mainPhone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Lorry Number <span className="required">*</span></label>
                    <input
                      name="lorryNumber"
                      value={formData.lorryNumber}
                      onChange={handleChange}
                      placeholder="e.g., ABC-1234"
                    />
                    {formErrors.lorryNumber && <span className="form-error">{formErrors.lorryNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Transporter Type <span className="required">*</span></label>
                    <select
                      name="transporterType"
                      value={formData.transporterType}
                      onChange={handleChange}
                    >
                      <option value="FCL">FCL</option>
                      <option value="Non FCL">Non FCL</option>
                    </select>
                  </div>

                  {formData.transporterType === 'FCL' && (
                    <>
                      <div className="form-group">
                        <label>Driver Name <span className="required">*</span></label>
                        <input
                          name="driverName"
                          value={formData.driverName}
                          onChange={handleChange}
                          onKeyPress={validateNameInput}
                          placeholder="Enter driver name"
                        />
                        {formErrors.driverName && <span className="form-error">{formErrors.driverName}</span>}
                      </div>

                      <div className="form-group">
                        <label>Size <span className="required">*</span></label>
                        <input
                          name="size"
                          value={formData.size}
                          onChange={handleChange}
                          placeholder="e.g., 20ft, 40ft"
                        />
                        {formErrors.size && <span className="form-error">{formErrors.size}</span>}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Registration Date <span className="required">*</span></label>
                    <input
                      type="date"
                      name="registrationDate"
                      value={formData.registrationDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group transporter-checkbox">
                    <label>
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                      Active Transporter
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">Address Information</h3>
                <div className="form-grid form-grid-three">
                  <div className="form-group">
                    <label>Address Number <span className="required">*</span></label>
                    <input
                      name="addressNumber"
                      value={formData.addressNumber}
                      onChange={handleChange}
                      placeholder="e.g., 45, 123/2A"
                    />
                    {formErrors.addressNumber && <span className="form-error">{formErrors.addressNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label>Street Name 1 <span className="required">*</span></label>
                    <input
                      name="addressStreet1"
                      value={formData.addressStreet1}
                      onChange={handleChange}
                      placeholder="e.g., Galle Road, Temple Road"
                    />
                    {formErrors.addressStreet1 && <span className="form-error">{formErrors.addressStreet1}</span>}
                  </div>

                  <div className="form-group">
                    <label>Street Name 2</label>
                    <input
                      name="addressStreet2"
                      value={formData.addressStreet2}
                      onChange={handleChange}
                      placeholder="e.g., Lane 3, Near School"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>District <span className="required">*</span></label>
                    <select
                      name="addressDistrict"
                      value={formData.addressDistrict}
                      onChange={handleChange}
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district.districtId} value={district.districtName}>
                          {district.districtName}
                        </option>
                      ))}
                    </select>
                    {formErrors.addressDistrict && <span className="form-error">{formErrors.addressDistrict}</span>}
                  </div>

                  <div className="form-group">
                    <label>City / Town <span className="required">*</span></label>
                    <select
                      name="addressCity"
                      value={formData.addressCity}
                      onChange={handleChange}
                      disabled={!formData.addressDistrict}
                    >
                      <option value="">Select City / Town</option>
                      {filteredCities.map((city) => (
                        <option key={city.cityId} value={city.cityName}>
                          {city.cityName}
                        </option>
                      ))}
                    </select>
                    {formErrors.addressCity && <span className="form-error">{formErrors.addressCity}</span>}
                  </div>

                  <div className="form-group">
                    <label>Country <span className="required">*</span></label>
                    <input
                      name="addressCountry"
                      value={formData.addressCountry}
                      onChange={handleChange}
                      placeholder="Sri Lanka"
                    />
                    {formErrors.addressCountry && <span className="form-error">{formErrors.addressCountry}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-heading-row">
                  <h3 className="section-heading">Contact Persons <span className="required">*</span> (At least 1 required, up to 2)</h3>
                  {formData.contactPersons.length < 2 && (
                    <button type="button" className="btn btn-secondary btn-small" onClick={addContactPerson}>
                      + Add Contact Person
                    </button>
                  )}
                </div>

                {formErrors.contactPersons && <span className="form-error section-error">{formErrors.contactPersons}</span>}

                {formData.contactPersons.map((contactPerson, index) => (
                  <div key={index} className="contact-person-card">
                    <div className="contact-person-header">
                      <h4>Contact Person {index + 1}</h4>
                      {formData.contactPersons.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => removeContactPerson(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Name <span className="required">*</span></label>
                        <input
                          value={contactPerson.name}
                          onChange={(event) => handleContactPersonChange(index, 'name', event.target.value)}
                          onKeyPress={validateNameInput}
                          placeholder="Enter contact person name"
                        />
                        {formErrors[`contactPersonName${index}`] && (
                          <span className="form-error">{formErrors[`contactPersonName${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Phone <span className="required">*</span></label>
                        <input
                          value={contactPerson.phone}
                          onChange={(event) => handleContactPersonChange(index, 'phone', event.target.value)}
                          onKeyPress={validatePhoneInput}
                          placeholder="0771234567"
                          maxLength="10"
                        />
                        {formErrors[`contactPersonPhone${index}`] && (
                          <span className="form-error">{formErrors[`contactPersonPhone${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          value={contactPerson.email}
                          onChange={(event) => handleContactPersonChange(index, 'email', event.target.value)}
                          placeholder="email@example.com"
                        />
                        {formErrors[`contactPersonEmail${index}`] && (
                          <span className="form-error">{formErrors[`contactPersonEmail${index}`]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingTransporter ? 'Update Transporter' : 'Create Transporter'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {showPaymentModal && selectedJobForPayment && (
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
                <span className="pm-subtitle">Job&nbsp;#{selectedJobForPayment.jobId}</span>
              </div>
            </div>
            <button className="pm-close" onClick={() => setShowPaymentModal(false)} aria-label="Close">×</button>
          </div>

          {/* ══════════════════════════════════════════
              ROW 1 — Job details (horizontal strip)
          ══════════════════════════════════════════ */}
          <div className="pm-body">
          <div className="pm-row pm-row-details">
            <div className="pm-detail-cell">
              <span className="pm-detail-label">Job ID</span>
              <span className="pm-detail-value"><code className="pm-code">{selectedJobForPayment.jobId}</code></span>
            </div>
            <div className="pm-detail-cell">
              <span className="pm-detail-label">Category</span>
              <span className="pm-detail-value">{selectedJobForPayment.shipmentCategory || '-'}</span>
            </div>
            <div className="pm-detail-cell">
              <span className="pm-detail-label">Transporter Cost</span>
              <span className="pm-detail-value pm-amount-total">LKR {formatAmount(getTransporterCostAmount(selectedJobForPayment))}</span>
            </div>
            {parseFloat(getPaymentDetails(selectedJobForPayment)?.paidAmount || 0) > 0 && (
              <div className="pm-detail-cell">
                <span className="pm-detail-label">Already Paid</span>
                <span className="pm-detail-value pm-amount-paid">LKR {formatAmount(getPaymentDetails(selectedJobForPayment)?.paidAmount || 0)}</span>
              </div>
            )}
            <div className={parseFloat(getPaymentDetails(selectedJobForPayment)?.paidAmount || 0) > 0 ? 'pm-detail-cell pm-detail-cell--due' : 'pm-detail-cell pm-detail-cell--due pm-detail-cell--due-only'}>
              <span className="pm-detail-label">Amount Due</span>
              <span className="pm-detail-value pm-amount-due">
                LKR {formatAmount(getRemainingTransporterCost(selectedJobForPayment))}
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
                    LKR {formatAmount(getRemainingTransporterCost(selectedJobForPayment))}
                  </div>
                  <span className="pm-full-badge">{isTransporterCostPartiallyPaid(selectedJobForPayment) ? 'Remaining balance' : 'Full balance'}</span>
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
                      <span>Total Amount</span>
                      <span>LKR {formatAmount(getTransporterCostAmount(selectedJobForPayment))}</span>
                    </div>
                    {parseFloat(getPaymentDetails(selectedJobForPayment)?.paidAmount || 0) > 0 && (
                      <div className="pm-bk-row">
                        <span>Already Paid</span>
                        <span className="pm-bk-paid">LKR {formatAmount(parseFloat(getPaymentDetails(selectedJobForPayment)?.paidAmount || 0))}</span>
                      </div>
                    )}
                    <div className="pm-bk-row">
                      <span>This Payment</span>
                      <span className="pm-bk-current">LKR {formatAmount(parseFloat(partialPaymentAmount) || 0)}</span>
                    </div>
                    <div className="pm-bk-row pm-bk-row--total">
                      <span>Remaining After</span>
                      <span>LKR {formatAmount(Math.max(0, getRemainingTransporterCost(selectedJobForPayment) - (parseFloat(partialPaymentAmount) || 0)))}</span>
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
                      setChequeNumber('');
                      setChequeDate('');
                      setChequeAmount('');
                      setBankName('Commercial Bank');
                      setSelectedChequeId('');
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
                  <div className="pm-fields-grid">
                    <div className="pm-field">
                      <label className="pm-field-label">Select Cheque <span className="pm-req">*</span></label>
                      <select 
                        className="pm-input"
                        value={selectedChequeId}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setSelectedChequeId(selected);
                          if (selected) {
                            const availableCheques = getAvailableChequesWithBalance();
                            const cheque = availableCheques.find(c => `${c.chequeNumber}-${c.chequeDate}` === selected);
                            if (cheque) {
                              setChequeNumber(cheque.chequeNumber);
                              setChequeDate(cheque.chequeDate);
                              setChequeAmount(String(cheque.chequeAmount - cheque.totalUsed));
                              setBankName(cheque.bankName || 'Commercial Bank');
                            }
                          } else {
                            setChequeNumber('');
                            setChequeDate('');
                            setChequeAmount('');
                          }
                        }}
                      >
                        <option value="">-- New Cheque --</option>
                        {getAvailableChequesWithBalance().map((cheque) => {
                          const remaining = cheque.chequeAmount - cheque.totalUsed;
                          return (
                            <option key={`${cheque.chequeNumber}-${cheque.chequeDate}`} value={`${cheque.chequeNumber}-${cheque.chequeDate}`}>
                              CHQ {cheque.chequeNumber} ({cheque.chequeDate}) - Remaining: LKR {formatAmount(remaining)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {selectedChequeId && (
                      <div className="pm-field">
                        <label className="pm-field-label">Remaining Balance</label>
                        <input 
                          type="text" 
                          className="pm-input" 
                          value={`LKR ${formatAmount(chequeAmount)}`}
                          disabled
                        />
                      </div>
                    )}
                    {!selectedChequeId && (
                      <>
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Number <span className="pm-req">*</span></label>
                          <input type="text" className="pm-input"
                            value={chequeNumber}
                            onChange={e => setChequeNumber(e.target.value)}
                            placeholder="e.g. 001234"
                          />
                        </div>
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Date <span className="pm-req">*</span></label>
                          <input type="date" className="pm-input"
                            value={chequeDate}
                            onChange={e => setChequeDate(e.target.value)}
                          />
                        </div>
                        <div className="pm-field">
                          <label className="pm-field-label">Cheque Amount (LKR) <span className="pm-req">*</span></label>
                          <input type="number" step="0.01" className="pm-input"
                            value={chequeAmount}
                            onChange={e => setChequeAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}
                    <div className="pm-field">
                      <label className="pm-field-label">Bank Name</label>
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
            <button className="pm-btn pm-btn--confirm" onClick={submitTransporterPayment}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm Payment
            </button>
          </div>

        </div>
      </div>
    )}
    </>
  );
}

export default Transporters;