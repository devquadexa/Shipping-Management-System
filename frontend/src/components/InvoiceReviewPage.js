import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceReviewService } from '../api/services/invoiceReviewService';
import { jobService } from '../api/services/jobService';
import Pagination from './Pagination';
import RejectionReasonModal from './RejectionReasonModal';
import '../styles/InvoiceReviewPage.css';

function InvoiceReviewPage() {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReviewForRejection, setSelectedReviewForRejection] = useState(null);
  const [processingReviewId, setProcessingReviewId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    if (user?.role === 'Waff Clerk') {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await invoiceReviewService.getReviewsForClerk(user.userId);
      // Ensure data is always an array
      const reviewsArray = Array.isArray(data) ? data : (data?.data ? data.data : []);
      setReviews(reviewsArray);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setMessage('Error loading invoice reviews');
      setReviews([]);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReviews = () => {
    if (!Array.isArray(reviews)) {
      return [];
    }
    return reviews.filter(review => {
      if (statusFilter === 'All') return true;
      return review.status === statusFilter;
    });
  };

  const getPaginatedReviews = () => {
    const filtered = getFilteredReviews();
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filtered.slice(startIndex, startIndex + recordsPerPage);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredReviews().length / recordsPerPage);
  };

  const handleApprove = async (reviewId) => {
    setProcessingReviewId(reviewId);
    try {
      console.log('Approving review:', reviewId);
      const response = await invoiceReviewService.approveReview(reviewId);
      console.log('Review approved:', response);
      setMessage('Review approved. Admin/Manager has been notified.');
      setTimeout(() => setMessage(''), 3000);
      fetchReviews();
      setExpandedReviewId(null);
    } catch (error) {
      console.error('Error approving review:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Error approving review';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessingReviewId(null);
    }
  };

  const handleRejectClick = (review) => {
    setSelectedReviewForRejection(review);
    setShowRejectionModal(true);
  };

  const handleRejectSubmit = async (reason) => {
    if (!selectedReviewForRejection) return;

    setProcessingReviewId(selectedReviewForRejection.reviewId);
    try {
      console.log('Rejecting review:', selectedReviewForRejection.reviewId, 'Reason:', reason);
      const response = await invoiceReviewService.rejectReview(selectedReviewForRejection.reviewId, reason);
      console.log('Review rejected:', response);
      setMessage('Review rejected. Admin/Manager has been notified with your reason.');
      setTimeout(() => setMessage(''), 3000);
      fetchReviews();
      setExpandedReviewId(null);
      setShowRejectionModal(false);
      setSelectedReviewForRejection(null);
    } catch (error) {
      console.error('Error rejecting review:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Error rejecting review';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessingReviewId(null);
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
      case 'Pending':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (user?.role !== 'Waff Clerk') {
    return (
      <div className="invoice-review-page">
        <div className="alert alert-error">
          Access Denied: This page is for Waff Clerks only
        </div>
      </div>
    );
  }

  const paginatedReviews = getPaginatedReviews();
  const totalPages = getTotalPages();

  return (
    <div className="invoice-review-page">
      <div className="page-header">
        <h1>📋 Invoice Reviews</h1>
        <p>Review invoices sent by Admin/Manager and approve or reject them</p>
      </div>

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Pending & Completed Reviews ({getFilteredReviews().length})</h2>
          <div className="filter-section">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="status-filter"
            >
              <option value="All">All Reviews</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <p>Loading reviews...</p>
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="empty-state">
              <p>No invoice reviews found</p>
            </div>
          ) : (
            <>
              <div className="reviews-list">
                {paginatedReviews.map((review) => (
                  <div key={review.reviewId} className="review-card">
                    <div className="review-header">
                      <div className="review-title-section">
                        <h3>Job ID: {review.jobId}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(review.status)}`}>
                          {review.status}
                        </span>
                      </div>
                      <button
                        className="expand-btn"
                        onClick={() => setExpandedReviewId(expandedReviewId === review.reviewId ? null : review.reviewId)}
                      >
                        {expandedReviewId === review.reviewId ? '▼' : '▶'}
                      </button>
                    </div>

                    <div className="review-summary">
                      <div className="summary-item">
                        <label>Shipment Category:</label>
                        <span>{review.invoiceDetails?.shipmentCategory || '-'}</span>
                      </div>
                      <div className="summary-item">
                        <label>Total Amount:</label>
                        <span className="amount">LKR {formatAmount(review.invoiceDetails?.totalAmount)}</span>
                      </div>
                      <div className="summary-item">
                        <label>Sent By:</label>
                        <span>{review.sentByName || review.sentBy || '-'}</span>
                      </div>
                      <div className="summary-item">
                        <label>Sent Date:</label>
                        <span>{new Date(review.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {expandedReviewId === review.reviewId && (
                      <div className="review-details">
                        <div className="review-notes-section">
                          <h4>Review Notes from Admin/Manager:</h4>
                          <div className="review-notes">
                            {review.reviewNotes || 'No notes provided'}
                          </div>
                        </div>

                        <div className="pay-items-section">
                          <h4>Pay Items Details:</h4>
                          <div className="pay-items-table-wrapper">
                            <table className="pay-items-table">
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th>Actual Cost</th>
                                  <th>Paid By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {review.payItems && review.payItems.length > 0 ? (
                                  review.payItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.description || item.name || '-'}</td>
                                      <td className="amount">LKR {formatAmount(item.actualCost || item.amount)}</td>
                                      <td>{item.paidBy || '-'}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                                      No pay items available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot>
                                <tr className="totals-row">
                                  <td><strong>TOTAL</strong></td>
                                  <td className="amount">
                                    <strong>
                                      LKR {formatAmount(
                                        review.payItems?.reduce((sum, item) => sum + (parseFloat(item.actualCost || item.amount) || 0), 0) || 0
                                      )}
                                    </strong>
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {review.status === 'Pending' && (
                          <div className="action-buttons">
                            <button
                              onClick={() => handleApprove(review.reviewId)}
                              className="btn btn-approve"
                              disabled={processingReviewId === review.reviewId}
                            >
                              {processingReviewId === review.reviewId ? '⏳ Processing...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectClick(review)}
                              className="btn btn-reject"
                              disabled={processingReviewId === review.reviewId}
                            >
                              {processingReviewId === review.reviewId ? '⏳ Processing...' : '✗ Reject'}
                            </button>
                          </div>
                        )}

                        {review.status === 'Rejected' && review.rejectionReason && (
                          <div className="rejection-info">
                            <h4>Your Rejection Reason:</h4>
                            <div className="rejection-reason">
                              {review.rejectionReason}
                            </div>
                          </div>
                        )}

                        {review.status === 'Approved' && (
                          <div className="approval-info">
                            <p>✓ This review has been approved and sent to Admin/Manager</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        show={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedReviewForRejection(null);
        }}
        onSubmit={handleRejectSubmit}
        loading={processingReviewId !== null}
      />
    </div>
  );
}

export default InvoiceReviewPage;
