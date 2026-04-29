import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Login from './components/Login';
import Customers from './components/Customers';
import Jobs from './components/Jobs';
import Billing from './components/Billing';
import PettyCash from './components/PettyCash';
import Reports from './components/Reports';
import PettyCashReport from './components/PettyCashReport';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import Accounting from './components/Accounting';
import Transporters from './components/Transporters';
import OldInvoices from './components/OldInvoices';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

// Guard that redirects non-admin users to home
function AdminRoute({ children }) {
  const { user } = useAuth();
  const allowed = user?.role === 'Admin' || user?.role === 'Super Admin';
  return allowed ? children : <Navigate to="/" />;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        {user && <Navbar />}

        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/transporters" element={<PrivateRoute><Transporters /></PrivateRoute>} />
          <Route path="/old-invoices" element={<PrivateRoute><OldInvoices /></PrivateRoute>} />
          <Route path="/accounting" element={<PrivateRoute><Accounting /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route
            path="/petty-cash"
            element={
              <PrivateRoute>
                {user?.role === 'Office Executive' ? <Navigate to="/" /> : <PettyCash />}
              </PrivateRoute>
            }
          />

          {/* Reports hub */}
          <Route
            path="/reports"
            element={<PrivateRoute><AdminRoute><Reports /></AdminRoute></PrivateRoute>}
          />

          {/* Individual report pages — all nested under /reports/ */}
          <Route
            path="/reports/petty-cash"
            element={<PrivateRoute><AdminRoute><PettyCashReport /></AdminRoute></PrivateRoute>}
          />

          {/* Legacy redirect — keep old bookmark working */}
          <Route path="/petty-cash-report" element={<Navigate to="/reports/petty-cash" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
