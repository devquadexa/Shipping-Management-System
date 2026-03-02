import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Billing() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [billPreview, setBillPreview] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBills();
    fetchJobs();
    fetchCustomers();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/billing');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const generateBill = async () => {
    if (!selectedJob) return;
    
    const job = jobs.find(j => j.jobId === selectedJob);
    if (!job) return;

    try {
      const response = await axios.post('/api/billing', {
        jobId: job.jobId,
        customerId: job.customerId,
        amount: job.shippingCost
      });
      
      const customer = customers.find(c => c.customerId === job.customerId);
      setBillPreview({ bill: response.data, customer, job });
      setMessage('Bill generated successfully!');
      fetchBills();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error generating bill');
    }
  };

  const markAsPaid = async (billId) => {
    try {
      await axios.patch(`/api/billing/${billId}/pay`);
      fetchBills();
      setMessage('Bill marked as paid!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const printBill = () => {
    if (!billPreview) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Invoice - Super Shine Cargo</title>');
    printWindow.document.write('<style>body{font-family:monospace;padding:20px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<pre>' + formatBill(billPreview) + '</pre>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const formatBill = ({ bill, customer, job }) => {
    return `
${'='.repeat(60)}
         SUPER SHINE CARGO SERVICE
           Sri Lanka's Premier Cargo Solutions
                    INVOICE
${'='.repeat(60)}
Bill ID      : ${bill.billId}
Job ID       : ${bill.jobId}
Customer ID  : ${bill.customerId}
Customer Name: ${customer.name}
Date         : ${new Date(bill.createdDate).toLocaleString()}
${'='.repeat(60)}
Job Details  : ${job.description}
Route        : ${job.origin} → ${job.destination}
Weight       : ${job.weight} kg
${'='.repeat(60)}
Amount       : LKR ${bill.amount.toFixed(2)}
Tax (10%)    : LKR ${bill.tax.toFixed(2)}
${'='.repeat(60)}
TOTAL        : LKR ${bill.total.toFixed(2)}
${'='.repeat(60)}
Payment Status: ${bill.paymentStatus}
${'='.repeat(60)}

Thank you for choosing Super Shine Cargo Service!
    `;
  };

  if (user?.role === 'User') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Admin or Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Billing Management</h1>
        <p>Generate and manage invoices</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <h2>Generate Bill</h2>
        <div className="form-group">
          <label>Select Job</label>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
            <option value="">Select Job</option>
            {jobs.map(job => (
              <option key={job.jobId} value={job.jobId}>
                {job.jobId} - {job.description} (LKR {job.shippingCost})
              </option>
            ))}
          </select>
        </div>
        <button onClick={generateBill} className="btn btn-primary">Generate Bill</button>
        
        {billPreview && (
          <div>
            <div className="bill-preview">{formatBill(billPreview)}</div>
            <button onClick={printBill} className="btn btn-success" style={{marginTop: '1rem'}}>
              🖨️ Print Bill
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>All Bills</h2>
        {bills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>No bills generated yet</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Job ID</th>
                <th>Customer ID</th>
                <th>Amount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.billId}>
                  <td><strong>{bill.billId}</strong></td>
                  <td>{bill.jobId}</td>
                  <td>{bill.customerId}</td>
                  <td>LKR {bill.amount.toFixed(2)}</td>
                  <td>LKR {bill.tax.toFixed(2)}</td>
                  <td><strong>LKR {bill.total.toFixed(2)}</strong></td>
                  <td>
                    <span className={`status-badge status-${bill.paymentStatus.toLowerCase()}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {bill.paymentStatus === 'Unpaid' && (
                      <button onClick={() => markAsPaid(bill.billId)} className="btn btn-success" style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}>
                        Mark Paid
                      </button>
                    )}
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
}

export default Billing;
