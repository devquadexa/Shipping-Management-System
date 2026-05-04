import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';

const REPORT_CARDS = [
  {
    id: 'petty-cash-report',
    path: '/reports/petty-cash',
    category: 'Financial',
    title: 'Petty Cash Report',
    description: 'Job-wise petty cash assignment breakdown for any selected date. Includes assigned amounts, settlements, outstanding balances and PDF / Excel export.',
    available: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    color: 'blue',
    tags: ['Daily', 'Export', 'Job-wise'],
  },
  {
    id: 'invoice-report',
    path: null,
    category: 'Financial',
    title: 'Invoice Report',
    description: 'Invoice summary, aging analysis and payment status overview across all customers and jobs.',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    color: 'green',
    tags: ['Aging', 'Export', 'Customer-wise'],
  },
  {
    id: 'cheque-report',
    path: null,
    category: 'Financial',
    title: 'Cheque Report',
    description: 'Cheque and bank transfer tracking with status breakdown — pending, cleared and bounced payments.',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2"></rect>
        <path d="M3 10h18"></path>
        <path d="M8 6V4"></path>
        <path d="M16 6V4"></path>
      </svg>
    ),
    color: 'amber',
    tags: ['Payments', 'Export', 'Bank-wise'],
  },
  {
    id: 'job-report',
    path: null,
    category: 'Operations',
    title: 'Job Report',
    description: 'Job status and performance overview — open, in-progress, completed and overdue jobs with shipment category breakdown.',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    color: 'purple',
    tags: ['Status', 'Export', 'Category-wise'],
  },
  {
    id: 'customer-report',
    path: null,
    category: 'Operations',
    title: 'Customer Report',
    description: 'Customer-wise billing summary, outstanding balances and payment history across all jobs.',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    color: 'teal',
    tags: ['Billing', 'Export', 'Customer-wise'],
  },
  {
    id: 'accounting-report',
    path: null,
    category: 'Operations',
    title: 'Accounting Summary',
    description: 'Profit and loss overview, revenue vs cost analysis and financial performance metrics by period.',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
        <polyline points="3 20 21 20"></polyline>
      </svg>
    ),
    color: 'red',
    tags: ['P&L', 'Export', 'Period-wise'],
  },
  {
    id: 'transporters-report',
    path: '/reports/transporters',
    category: 'Financial',
    title: 'Transporters Report',
    description: 'Transporter-wise payment details, job assignments, paid amounts, balances and outstanding payments.',
    available: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 18 16 18 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    ),
    color: 'orange',
    tags: ['Payments', 'Export', 'Transporter-wise'],
  },
];

const CATEGORIES = ['Financial', 'Operations'];

function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const canAccess = user?.role === 'Admin' || user?.role === 'Super Admin';

  if (!canAccess) {
    return (
      <div className="rpt-access-denied">
        <div className="rpt-access-box">
          <div className="rpt-access-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Access Restricted</h2>
          <p>Only Super Admin and Admin users can access the Reports section.</p>
        </div>
      </div>
    );
  }

  const handleCardClick = (card) => {
    if (card.available && card.path) {
      navigate(card.path);
    }
  };

  return (
    <div className="rpt-container">
      {/* Page header */}
      <div className="rpt-header">
        <div>
          <h1 className="rpt-title">Reports</h1>
          <p className="rpt-subtitle">
            Select a report to view detailed data, apply filters and export results.
          </p>
        </div>
        <div className="rpt-header-meta">
          <span className="rpt-available-count">
            {REPORT_CARDS.filter(r => r.available).length} available
          </span>
          <span className="rpt-total-count">
            {REPORT_CARDS.length} total
          </span>
        </div>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(category => {
        const cards = REPORT_CARDS.filter(r => r.category === category);
        return (
          <section key={category} className="rpt-section">
            <div className="rpt-section-header">
              <h2 className="rpt-section-title">{category} Reports</h2>
              <div className="rpt-section-line"></div>
            </div>

            <div className="rpt-grid">
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`rpt-card rpt-card-${card.color} ${card.available ? 'rpt-card-available' : 'rpt-card-soon'}`}
                  onClick={() => handleCardClick(card)}
                  role={card.available ? 'button' : undefined}
                  tabIndex={card.available ? 0 : undefined}
                  onKeyDown={card.available ? (e) => e.key === 'Enter' && handleCardClick(card) : undefined}
                  aria-label={card.available ? `Open ${card.title}` : `${card.title} — coming soon`}
                >
                  {/* Availability badge */}
                  {card.available ? (
                    <span className="rpt-badge rpt-badge-available">Available</span>
                  ) : (
                    <span className="rpt-badge rpt-badge-soon">Coming Soon</span>
                  )}

                  {/* Icon */}
                  <div className={`rpt-card-icon rpt-icon-${card.color}`}>
                    {card.icon}
                  </div>

                  {/* Content */}
                  <div className="rpt-card-body">
                    <h3 className="rpt-card-title">{card.title}</h3>
                    <p className="rpt-card-desc">{card.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="rpt-card-tags">
                    {card.tags.map(tag => (
                      <span key={tag} className="rpt-tag">{tag}</span>
                    ))}
                  </div>

                  {/* Arrow — only for available */}
                  {card.available && (
                    <div className="rpt-card-arrow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default Reports;
