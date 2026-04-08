import React from 'react';
import { LayoutDashboard, Users, IndianRupee, Home, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'properties', label: 'Properties', icon: Home },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-gray-100 bg-white fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold text-base">H</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">HostOS</div>
            <div className="text-xs text-gray-400 font-medium">Property Manager</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={isActive
                ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                : { color: '#6B7280' }
              }
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Admin link */}
      {user?.role === 'admin' && (
        <div className="px-3 pb-2">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
          >
            <Shield size={18} />
            Admin Panel
          </button>
        </div>
      )}

      {/* User info */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--color-primary)' }}>
            {user?.name?.[0]?.toUpperCase() || 'H'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>

        {/* Trial badge */}
        {user?.subscriptionStatus === 'trial' && (
          <div className="badge-warning w-full text-center mb-3 py-1.5 rounded-lg text-xs">
            {user?.trialDaysLeft}d trial left
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
