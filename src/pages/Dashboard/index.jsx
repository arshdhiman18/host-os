import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import UpgradeModal from '../../components/UpgradeModal';
import { useAuth } from '../../context/AuthContext';
import { Lock, Check, Headphones } from 'lucide-react';

import Overview from './Overview';
import Guests from './Guests';
import Earnings from './Earnings';
import Properties from './Properties';
import Verification from './Verification';
import Billing from './Billing';
import Calendar from './Calendar';

const TABS = ['overview', 'guests', 'earnings', 'properties', 'calendar', 'billing'];

const GATE_FEATURES = [
  'Unlimited guest bookings',
  'ID proof uploads & verification',
  'Earnings tracking & reports',
  'Excel export',
  'Multiple properties',
  'Unique guest check-in links',
];

function UpgradeGate({ onUpgradeClick, onContactClick }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] px-4 py-10">
      <div className="w-full max-w-sm">

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-primary-light)' }}>
          <Lock size={26} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">
          Your subscription has ended
        </h2>
        <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
          Reactivate your plan to continue managing your properties, guests, and earnings.
        </p>

        <div className="rounded-2xl border border-gray-100 p-4 mb-6 space-y-2.5"
          style={{ background: 'var(--color-primary-light)' }}>
          {GATE_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                <Check size={11} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-primary-dark)' }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgradeClick}
          className="btn-primary w-full text-base py-3.5 font-bold mb-3"
        >
          Reactivate — from ₹999/mo
        </button>

        <button
          onClick={onContactClick}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Headphones size={15} />
          Talk to support
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Secure payment via Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const activeTab = TABS.includes(tab) ? tab : 'overview';

  const handleTabChange = (newTab) => {
    navigate(`/dashboard/${newTab}`, { replace: true });
  };

  const isExpired = user && !user.hasAccess;

  const needsVerification =
    user &&
    user.role !== 'admin' &&
    user.verificationStatus !== 'verified' &&
    user.verificationStatus != null;

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        {needsVerification ? (
          <Verification />
        ) : isExpired ? (
          <UpgradeGate
            onUpgradeClick={() => setShowUpgrade(true)}
            onContactClick={() => setShowContact(true)}
          />
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'overview'    && <Overview onTabChange={handleTabChange} />}
            {activeTab === 'guests'      && <Guests />}
            {activeTab === 'earnings'    && <Earnings />}
            {activeTab === 'properties'  && <Properties />}
            {activeTab === 'calendar'    && <Calendar />}
            {activeTab === 'billing'     && <Billing onUpgradeClick={() => setShowUpgrade(true)} />}
          </div>
        )}

        {/* Trial ending banner — last 3 days only */}
        {!needsVerification && !isExpired && user?.subscriptionStatus === 'trial' && user?.trialDaysLeft <= 3 && (
          <div
            className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-64 md:right-4 rounded-2xl p-3 flex items-center justify-between shadow-card-lg z-40 cursor-pointer"
            style={{ background: 'var(--color-accent)', color: 'white' }}
            onClick={() => setShowUpgrade(true)}
          >
            <span className="text-sm font-bold">
              ⚡ {user.trialDaysLeft} day{user.trialDaysLeft !== 1 ? 's' : ''} left in trial
            </span>
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-lg">
              Upgrade →
            </span>
          </div>
        )}
      </Layout>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        subscriptionStatus={user?.subscriptionStatus}
      />

      {/* Contact support modal */}
      {showContact && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowContact(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Contact Support</h3>
              <button
                onClick={() => setShowContact(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <a href="tel:+919876543210"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light)' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>📞</span>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Call us</div>
                  <div className="text-sm font-semibold text-gray-900">+91 98765 43210</div>
                </div>
              </a>
              <a href="mailto:support@hostos.in"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light)' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>✉️</span>
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
    </>
  );
}
