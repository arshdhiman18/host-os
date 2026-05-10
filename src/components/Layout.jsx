import React, { useState } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import PushPermission from './PushPermission';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronDown, Headphones, Zap, X, Phone, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PAGE_TITLES = {
  overview: 'Dashboard',
  guests: 'Guests',
  earnings: 'Earnings',
  billing: 'Billing',
  calendar: 'Calendar',
  properties: 'Properties',
};

export default function Layout({ activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.current || !passForm.next || !passForm.confirm) {
      toast.error('Fill in all fields'); return;
    }
    if (passForm.next !== passForm.confirm) {
      toast.error('New passwords do not match'); return;
    }
    if (passForm.next.length < 6) {
      toast.error('New password must be at least 6 characters'); return;
    }
    setPassLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passForm.current,
        newPassword: passForm.next,
      });
      toast.success('Password changed successfully');
      setChangePassOpen(false);
      setPassForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const dropdown = profileOpen && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
          <div className="text-xs text-gray-400 truncate">{user?.email}</div>
        </div>

        {user?.subscriptionStatus === 'trial' && (
          <button
            onClick={() => { onTabChange('billing'); setProfileOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-amber-50 transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            <Zap size={15} />
            Upgrade Plan
          </button>
        )}

        <button
          onClick={() => { setChangePassOpen(true); setProfileOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <KeyRound size={15} />
          Change Password
        </button>

        <button
          onClick={() => { setContactOpen(true); setProfileOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Headphones size={15} />
          Contact Support
        </button>

        <div className="border-t border-gray-100 mt-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

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
            <NotificationBell onNavigate={onTabChange} />
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--color-primary)' }}
              >
                {user?.name?.[0]?.toUpperCase() || 'H'}
              </button>
              {dropdown}
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white border-b border-gray-100 px-6 items-center justify-between"
          style={{ height: '60px' }}>
          <h1 className="font-bold text-gray-900 capitalize text-lg">
            {PAGE_TITLES[activeTab] || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            {user?.subscriptionStatus === 'expired' && (
              <span className="badge-danger px-3 py-1 text-xs font-semibold">
                Subscription Expired
              </span>
            )}
            <NotificationBell onNavigate={onTabChange} />
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-all"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--color-primary)' }}>
                  {user?.name?.[0]?.toUpperCase() || 'H'}
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdown}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 pt-5 pb-nav md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      <PushPermission />

      {/* Change Password modal */}
      {changePassOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setChangePassOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setChangePassOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="input-group">
                <label className="label">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter current password"
                    value={passForm.current}
                    onChange={e => setPassForm(f => ({ ...f, current: e.target.value }))}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-0.5">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNext ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Min. 6 characters"
                    value={passForm.next}
                    onChange={e => setPassForm(f => ({ ...f, next: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowNext(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-0.5">
                    {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Re-enter new password"
                  value={passForm.confirm}
                  onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="btn-primary w-full py-3 font-bold mt-1"
              >
                {passLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Support modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setContactOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Contact Support</h3>
              <button
                onClick={() => setContactOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <a href="tel:+919876543210"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light)' }}>
                  <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Call us</div>
                  <div className="text-sm font-semibold text-gray-900">+91 98765 43210</div>
                </div>
              </a>

              <a href="mailto:support@hostos.in"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light)' }}>
                  <Mail size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Email us</div>
                  <div className="text-sm font-semibold text-gray-900">support@hostos.in</div>
                </div>
              </a>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">We typically respond within 24 hours</p>
          </div>
        </div>
      )}
    </div>
  );
}
