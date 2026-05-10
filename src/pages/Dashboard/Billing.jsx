import React from 'react';
import { CreditCard, Check, Clock, CalendarDays, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const features = [
  'Unlimited guest bookings',
  'ID proof uploads',
  'Earnings tracking & reports',
  'Excel export',
  'Multiple properties',
  'Unique guest links per property',
];

function StatusBadge({ status }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: '#D1FAE5', color: '#065F46' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      Active
    </span>
  );
  if (status === 'trial') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold badge-warning">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
      Free Trial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: '#FEE2E2', color: '#991B1B' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Expired
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Billing({ onUpgradeClick }) {
  const { user } = useAuth();

  const isActive = user?.subscriptionStatus === 'active';
  const isTrial = user?.subscriptionStatus === 'trial';
  const isExpired = user?.subscriptionStatus === 'expired';

  const planLabel = isActive
    ? user?.subscriptionPlan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'
    : isTrial ? 'Free Trial' : 'No Active Plan';

  const expiryDate = isActive ? user?.subscriptionEndDate : user?.trialEndDate;
  const daysLeft = isActive
    ? Math.max(0, Math.ceil((new Date(user?.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : user?.trialDaysLeft ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">

      {/* Current plan card */}
      <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}>
            <CreditCard size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Current Plan</div>
            <div className="font-bold text-gray-900 text-base">{planLabel}</div>
          </div>
          <div className="ml-auto">
            <StatusBadge status={user?.subscriptionStatus} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                {isExpired ? 'Status' : 'Days Left'}
              </span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: 'var(--color-primary-dark)' }}>
              {isExpired ? '—' : daysLeft}
            </div>
            {!isExpired && (
              <div className="text-xs text-gray-500 mt-0.5">{isTrial ? 'trial days' : 'days remaining'}</div>
            )}
          </div>

          <div className="rounded-xl p-3 bg-gray-50">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarDays size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">
                {isActive ? 'Renews On' : isTrial ? 'Trial Ends' : 'Expired On'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-800">{formatDate(expiryDate)}</div>
          </div>
        </div>

        {/* Subscribe / Renew button */}
        {!isActive && (
          <button
            onClick={onUpgradeClick}
            className="btn-primary w-full mt-4 py-3 font-bold flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            {isExpired ? 'Resubscribe Now' : 'Subscribe Now'}
          </button>
        )}

        {isActive && (
          <button
            onClick={onUpgradeClick}
            className="w-full mt-4 py-3 font-bold rounded-xl border-2 text-sm transition-all flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            <Zap size={16} />
            Extend / Change Plan
          </button>
        )}
      </div>

      {/* What's included */}
      <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
        <div className="text-sm font-bold text-gray-700 mb-3">What's included</div>
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-primary-light)' }}>
                <Check size={11} style={{ color: 'var(--color-primary)' }} />
              </div>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing reference */}
      <div className="bg-white rounded-2xl shadow-card p-5 border border-gray-100">
        <div className="text-sm font-bold text-gray-700 mb-3">Plans</div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl p-3 border-2" style={{ borderColor: 'var(--color-primary)' }}>
            <div className="text-xs font-semibold text-gray-500">Monthly</div>
            <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--color-primary)' }}>₹999</div>
            <div className="text-xs text-gray-400">per month</div>
          </div>
          <div className="flex-1 rounded-xl p-3 border-2 border-gray-100 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500">Yearly</div>
            <div className="text-xl font-extrabold mt-1 text-gray-800">₹8,000</div>
            <div className="text-xs text-gray-400">per year</div>
          </div>
        </div>
      </div>

    </div>
  );
}
