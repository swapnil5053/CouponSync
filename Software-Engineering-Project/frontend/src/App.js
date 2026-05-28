import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Coupons from './pages/Coupons';
import MyCoupons from './pages/MyCoupons';
import BrowseCampaigns from './pages/BrowseCampaigns';
import RedeemCoupon from './pages/RedeemCoupon';
import Redemptions from './pages/Redemptions';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';

const isCustomerRole = (role) => role === 'user' || role === 'customer';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-teal-600 to-emerald-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Root redirect component (redirect to appropriate page based on role)
const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-teal-600 to-emerald-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  // Redirect customers to browse campaigns, others to dashboard
  if (isCustomerRole(user?.role)) {
    return <Navigate to="/browse-campaigns" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-teal-600 to-emerald-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate page based on role
    if (isCustomerRole(user?.role)) {
      return <Navigate to="/browse-campaigns" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Campaigns />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Coupons />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-coupons"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <MyCoupons />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/browse-campaigns"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <BrowseCampaigns />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/redeem-coupon"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <RedeemCoupon />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/redemptions"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Redemptions />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Reports />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <>
                    <Navbar />
                    <Users />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Profile />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Default Route - redirect based on user role */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
