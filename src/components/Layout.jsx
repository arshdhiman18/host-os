import React from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Menu, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Layout({ activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main content area */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header
          className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 flex items-center justify-between"
          style={{ height: 'var(--header-height)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-gray-900 text-base">HostOS</span>
          </div>

          <div className="flex items-center gap-2">
            {user?.subscriptionStatus === 'trial' && (
              <span className="badge-warning text-xs px-2.5 py-1">
                {user?.trialDaysLeft}d left
              </span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--color-primary)' }}>
              {user?.name?.[0]?.toUpperCase() || 'H'}
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white border-b border-gray-100 px-6 items-center justify-between"
          style={{ height: '60px' }}>
          <div>
            <h1 className="font-bold text-gray-900 capitalize text-lg">
              {activeTab === 'overview' ? 'Dashboard' :
               activeTab === 'guests' ? 'Guests' :
               activeTab === 'earnings' ? 'Earnings' : 'Properties'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.subscriptionStatus === 'trial' && (
              <span className="badge-warning px-3 py-1 text-xs font-semibold">
                Trial: {user?.trialDaysLeft} days left
              </span>
            )}
            {user?.subscriptionStatus === 'expired' && (
              <span className="badge-danger px-3 py-1 text-xs font-semibold">
                Subscription Expired
              </span>
            )}
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--color-primary)' }}>
                {user?.name?.[0]?.toUpperCase() || 'H'}
              </div>
              {user?.name}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 md:px-6 py-5 pb-nav md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
