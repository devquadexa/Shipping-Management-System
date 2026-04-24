import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { transporterService } from '../api/services/transporterService';
import { jobService } from '../api/services/jobService';
import { billingService } from '../api/services/billingService';
import '../styles/Transporters.css';

const initialFormData = {
  name: '',
  mainPhone: '',
  email: '',
  registrationDate: new Date().toISOString().split('T')[0],
  addressNumber: '',
  addressStreet1: '',
  addressStreet2: '',
  addressDistrict: '',
  addressCity: '',
  addressCountry: 'Sri Lanka',
  contactPersons: [{ name: '', phone: '', email: '' }],
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
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeAmount, setChequeAmount] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank');
  const [expandedPaymentDetails, setExpandedPaymentDetails] = useState(null);

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

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

  const getPaymentStatusClassName = (status) => {
    return String(status || 'Not Billed').toLowerCase().replace(/\s+/g, '-');
  };

  const getTransporterCostItems = (job) => {
    const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
    return payItems.filter((item) => {
      const label = (item?.description || item?.name || '').toLowerCase().trim();
      return label === 'transporter cost';
    });
  };

  const getTransporterCostAmount = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return 0;

    return transporterCostItems.reduce((sum, item) => {
      return sum + (parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0);
    }, 0);
  };

  const isTransporterCostPaid = (job) => {
    const transporterCostItems = getTransporterCostItems(job);
    if (!transporterCostItems.length) return false;

    return transporterCostItems.every((item) => (
      item.paymentStatus === 'Paid' ||
      item.isPaid === true ||
      item.paidAt ||
      item.paidAmount > 0
    ));
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
    setChequeNumber('');
    setChequeDate('');
    setChequeAmount('');
    setBankName('Commercial Bank');
    setShowPaymentModal(true);
  };

  const submitTransporterPayment = async () => {
    if (!selectedJobForPayment) return;

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
      const updatedPayItems = (Array.isArray(selectedJobForPayment.payItems) ? selectedJobForPayment.payItems : []).map((item) => {
        const label = (item?.description || item?.name || '').toLowerCase().trim();
        if (label !== 'transporter cost') return item;

        const itemAmount = parseFloat(item.billingAmount || item.amount || item.actualCost || 0) || 0;
        return {
          ...item,
          paymentStatus: 'Paid',
          isPaid: true,
          paidAmount: itemAmount,
          paidAt: new Date().toISOString(),
          paidBy: user?.userId || user?.username || user?.name || 'System',
          paidByName: user?.name || user?.fullName || user?.username || user?.userId || 'System',
          paymentMethod,
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
      setMessage(`✅ Transporter cost marked as paid for ${selectedJobForPayment.jobId} via ${paymentMethod}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Error paying transporter cost:', error);
      setMessage(error.response?.data?.message || '❌ Error paying transporter cost');
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
                        <span className="cell-value">{transporter.registrationDate
                          ? new Date(transporter.registrationDate).toLocaleDateString()
                          : '-'}</span>
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
                              <h4 className="section-title">Assigned Jobs ({assignedJobs.length})</h4>
                              {assignedJobs.length === 0 ? (
                                <div className="detail-value-block">No jobs assigned to this transporter</div>
                              ) : (
                                <div className="assigned-jobs-table-wrapper">
                                  <table className="assigned-jobs-table">
                                    <colgroup>
                                      <col style={{ width: '20%' }} />
                                      <col style={{ width: '22%' }} />
                                      <col style={{ width: '20%' }} />
                                      <col style={{ width: '18%' }} />
                                      <col style={{ width: '20%' }} />
                                    </colgroup>
                                    <thead>
                                      <tr>
                                        <th>Job ID</th>
                                        <th>Category</th>
                                        <th>Transporter Cost</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assignedJobs.map((job) => (
                                        <React.Fragment key={job.jobId}>
                                          <tr>
                                          <td>
                                            <span className="job-id-cell">
                                              {job.jobId || '-'}{job.cusdecNumber && ` / ${job.cusdecNumber}`}
                                            </span>
                                          </td>
                                          <td>{job.shipmentCategory || '-'}</td>
                                          <td>
                                            {getTransporterCostAmount(job) > 0 ? (
                                              <div className="transporter-cost-cell">
                                                <span className="transporter-cost-amount">
                                                  LKR {formatAmount(getTransporterCostAmount(job))}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="transporter-no-cost">-</span>
                                            )}
                                          </td>
                                          <td>
                                            {(() => {
                                              const paymentStatus = getJobPaymentStatus(job.jobId);
                                              return (
                                                <span className={`payment-status-badge payment-${getPaymentStatusClassName(paymentStatus)}`}>
                                                  {paymentStatus}
                                                </span>
                                              );
                                            })()}
                                          </td>
                                          <td>
                                            <div className="action-cell-wrapper">
                                              <div className="action-buttons">
                                                {getTransporterCostAmount(job) > 0 ? (
                                                  isTransporterCostPaid(job) ? (
                                                    <span className="transporter-paid-badge">
                                                      Paid{getPaidByLabel(job) ? ` by ${getPaidByLabel(job)}` : ''}
                                                    </span>
                                                  ) : canPayTransporterCosts ? (
                                                    <button
                                                      type="button"
                                                      className="btn-action btn-pay-amount"
                                                      onClick={() => openPaymentModal(job)}
                                                    >
                                                      Pay the amount
                                                    </button>
                                                  ) : (
                                                    <span className="transporter-unpaid-badge">Unpaid</span>
                                                  )
                                                ) : (
                                                  <span className="transporter-no-cost">-</span>
                                                )}
                                              </div>
                                              {getTransporterCostAmount(job) > 0 && (
                                                <button
                                                  type="button"
                                                  className="expand-btn-middle"
                                                  onClick={() => setExpandedPaymentDetails(expandedPaymentDetails === job.jobId ? null : job.jobId)}
                                                  title={expandedPaymentDetails === job.jobId ? "Hide details" : "View details"}
                                                >
                                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points={expandedPaymentDetails === job.jobId ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                        {expandedPaymentDetails === job.jobId && (
                                          <tr className="payment-details-row">
                                            <td colSpan="5">
                                              <div className="payment-details-expanded">
                                                <div className="detail-card">
                                                  <div className="detail-card-label">AMOUNT</div>
                                                  <div className="detail-card-value">LKR {formatAmount(getTransporterCostAmount(job))}</div>
                                                </div>
                                                {isTransporterCostPaid(job) && getPaymentDetails(job) && (
                                                  <>
                                                    <div className="detail-card">
                                                      <div className="detail-card-label">PAID BY</div>
                                                      <div className="detail-card-value">{getPaymentDetails(job).paidByName || '-'}</div>
                                                    </div>
                                                    <div className="detail-card">
                                                      <div className="detail-card-label">PAYMENT METHOD</div>
                                                      <div className="detail-card-value">{getPaymentDetails(job).paymentMethod || '-'}</div>
                                                    </div>
                                                    {getPaymentDetails(job).paymentMethod === 'Cheque' && (
                                                      <>
                                                        <div className="detail-card">
                                                          <div className="detail-card-label">CHEQUE #</div>
                                                          <div className="detail-card-value">{getPaymentDetails(job).chequeNumber || '-'}</div>
                                                        </div>
                                                        <div className="detail-card">
                                                          <div className="detail-card-label">CHEQUE DATE</div>
                                                          <div className="detail-card-value">{getPaymentDetails(job).chequeDate || '-'}</div>
                                                        </div>
                                                      </>
                                                    )}
                                                    {getPaymentDetails(job).paymentMethod === 'Bank Transfer' && (
                                                      <div className="detail-card">
                                                        <div className="detail-card-label">BANK</div>
                                                        <div className="detail-card-value">{getPaymentDetails(job).bankName || '-'}</div>
                                                      </div>
                                                    )}
                                                    <div className="detail-card">
                                                      <div className="detail-card-label">PAID AT</div>
                                                      <div className="detail-card-value">{getPaymentDetails(job).paidAt ? new Date(getPaymentDetails(job).paidAt).toLocaleDateString() : '-'}</div>
                                                    </div>
                                                  </>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(event) => event.stopPropagation()}>
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
                    <label>Email Address <span className="required">*</span></label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                  </div>

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
      {showPaymentModal && selectedJobForPayment && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>💳 Payment Details</h3>
              <button className="modal-close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="payment-modal-body">
              <div className="invoice-summary">
                <div className="summary-row">
                  <span className="summary-label">Job ID:</span>
                  <span className="summary-value">{selectedJobForPayment.jobId}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Category:</span>
                  <span className="summary-value">{selectedJobForPayment.shipmentCategory || '-'}</span>
                </div>
                <div className="summary-row total-row">
                  <span className="summary-label">Amount to Pay:</span>
                  <span className="summary-value amount-highlight">LKR {formatAmount(getTransporterCostAmount(selectedJobForPayment))}</span>
                </div>
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label>Payment Method <span style={{color: '#dc2626'}}>*</span></label>
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {paymentMethod === 'Cheque' && (
                  <div className="cheque-details">
                    <div className="cheque-notice">
                      <span className="notice-icon">📝</span>
                      <span>Please provide cheque details</span>
                    </div>
                    <div className="form-group">
                      <label>Cheque Number <span style={{color: '#dc2626'}}>*</span></label>
                      <input type="text" className="form-control" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} placeholder="Enter cheque number" />
                    </div>
                    <div className="form-group">
                      <label>Cheque Date <span style={{color: '#dc2626'}}>*</span></label>
                      <input type="date" className="form-control" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Cheque Amount (LKR) <span style={{color: '#dc2626'}}>*</span></label>
                      <input type="number" step="0.01" className="form-control" value={chequeAmount} onChange={(e) => setChequeAmount(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Bank Transfer' && (
                  <div className="bank-details">
                    <div className="bank-notice">
                      <span className="notice-icon">🏦</span>
                      <span>Please select the bank</span>
                    </div>
                    <div className="form-group">
                      <label>Bank Name <span style={{color: '#dc2626'}}>*</span></label>
                      <select className="form-control" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                        <option value="Commercial Bank">Commercial Bank</option>
                        <option value="Peoples Bank">Peoples Bank</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="payment-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={submitTransporterPayment}>✓ Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transporters;