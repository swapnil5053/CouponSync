import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  TicketIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const isCustomerRole = (role) => role === 'user' || role === 'customer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Customer navigation - prioritize browsing campaigns
  const customerNavigation = [
    { name: 'Browse Campaigns', href: '/browse-campaigns', icon: SparklesIcon },
    { name: 'My Coupons', href: '/my-coupons', icon: TicketIcon },
    { name: 'Redeem Coupon', href: '/redeem-coupon', icon: ShoppingBagIcon },
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  ];

  // Merchant/Admin navigation
  const merchantNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Campaigns', href: '/campaigns', icon: ChartBarIcon },
    { name: 'Coupons', href: '/coupons', icon: TicketIcon },
    { name: 'Redemptions', href: '/redemptions', icon: DocumentTextIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  ];

  const adminOnlyNav = [
    { name: 'Users', href: '/users', icon: UserGroupIcon },
  ];

  // Determine which navigation to show
  let navigation = [];
  if (isCustomerRole(user?.role)) {
    navigation = customerNavigation;
  } else if (user?.role === 'merchant') {
    navigation = merchantNavigation;
  } else if (user?.role === 'admin') {
    navigation = [...merchantNavigation, ...adminOnlyNav];
  }

  return (
    <nav className="bg-gradient-to-r from-primary-600 to-teal-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to={isCustomerRole(user?.role) ? '/browse-campaigns' : '/dashboard'} className="text-white font-bold text-xl flex items-center space-x-2 hover:opacity-90 transition">
                <div className="bg-white/20 p-2 rounded-lg">
                  <TicketIcon className="h-6 w-6" />
                </div>
                <span className="hidden sm:inline">CouponSync</span>
              </Link>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/25 text-white shadow-lg scale-105'
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/70 capitalize flex items-center justify-end">
                  {isCustomerRole(user?.role) ? (
                    <><UserCircleIcon className="h-3 w-3 mr-1" /> Customer</>
                  ) : user?.role === 'merchant' ? (
                    <><ShoppingBagIcon className="h-3 w-3 mr-1" /> Merchant</>
                  ) : (
                    'Admin'
                  )}
                </p>
              </div>
              <Link
                to="/profile"
                className="text-white/80 hover:text-white transition-colors duration-200 hover:bg-white/10 p-2 rounded-lg"
              >
                <UserCircleIcon className="h-7 w-7" />
              </Link>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile User Info */}
            <div className="px-3 py-3 border-b border-white/20 mb-2 bg-white/5 rounded-lg">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/70 capitalize mt-1">
                {isCustomerRole(user?.role) ? 'Customer' : user?.role}
              </p>
            </div>

            {/* Mobile Navigation Links */}
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/25 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Profile Link Mobile */}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-3 text-base font-medium rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200"
            >
              <UserCircleIcon className="h-5 w-5 mr-3" />
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
