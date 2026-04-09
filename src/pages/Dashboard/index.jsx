import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import UpgradeModal from '../../components/UpgradeModal';
import { useAuth } from '../../context/AuthContext';

import Overview from './Overview';
import Guests from './Guests';
import Earnings from './Earnings';
import Properties from './Properties';
import Verification from './Verification';

const TABS = ['overview', 'guests', 'earnings', 'properties'];

export default function Dashboard() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const activeTab = TABS.includes(tab) ? tab : 'overview';

  const handleTabChange = (newTab) => {
    navigate(`/dashboard/${newTab}`, { replace: true });
  };

  const isExpired = user && !user.hasAccess;

  // Verification gate: if unverified or pending, show verification screen
  // (admin bypass — admins don't need verification)
  const needsVerification =
    user &&
    user.role !== 'admin' &&
    user.verificationStatus !== 'verified' &&
    user.verificationStatus != null; // null/undefined = old users, let them through

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        {needsVerification ? (
          <Verification />
        ) : isExpired ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-primary-light)' }}>
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Your trial has ended
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Subscribe to continue managing your properties and guests.
            </p>
            <button onClick={() => setShowUpgrade(true)} className="btn-primary px-8 py-4 text-base">
              View Plans
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'overview' && <Overview onTabChange={handleTabChange} />}
            {activeTab === 'guests' && <Guests />}
            {activeTab === 'earnings' && <Earnings />}
            {activeTab === 'properties' && <Properties />}
          </div>
        )}

        {/* Trial banner */}
        {!needsVerification && user?.subscriptionStatus === 'trial' && user?.trialDaysLeft <= 3 && (
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

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
