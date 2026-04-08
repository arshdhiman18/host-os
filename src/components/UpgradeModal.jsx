import React, { useState } from 'react';
import { Check, Zap, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹500',
    period: '/month',
    badge: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₹3,000',
    period: '/year',
    badge: '50% off',
  },
];

const features = [
  'Unlimited guest bookings',
  'ID proof uploads',
  'Earnings tracking & reports',
  'Excel export',
  'Multiple properties',
  'Unique guest links per property',
];

export default function UpgradeModal({ isOpen, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/subscription/create-order', { plan: selectedPlan });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'HostOS',
        description: `${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post('/subscription/verify', {
              ...response,
              plan: selectedPlan,
            });
            await refreshUser();
            toast.success('Subscription activated! Welcome aboard 🎉');
            onClose();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {},
        theme: { color: '#509B8D' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl animate-fade-in-up">
        {/* Handle */}
        <div className="md:hidden flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X size={16} className="text-gray-500" />
        </button>

        <div className="px-6 pt-6 pb-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--color-primary-light)' }}>
              <Zap size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Upgrade to HostOS Pro</h2>
            <p className="text-sm text-gray-500 mt-1">Your free trial has ended. Continue managing your properties.</p>
          </div>

          {/* Plan selector */}
          <div className="flex gap-3 mb-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className="flex-1 relative border-2 rounded-2xl p-4 text-left transition-all"
                style={selectedPlan === plan.id
                  ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' }
                  : { borderColor: '#E5E7EB' }
                }
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-3 badge-warning text-xs px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="font-bold text-gray-900 text-sm">{plan.label}</div>
                <div className="text-xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
                  {plan.price}
                </div>
                <div className="text-xs text-gray-400">{plan.period}</div>
              </button>
            ))}
          </div>

          {/* Features */}
          <ul className="space-y-2 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-light)' }}>
                  <Check size={12} style={{ color: 'var(--color-primary)' }} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-primary w-full text-base py-4 font-bold"
          >
            {loading ? 'Processing...' : `Subscribe – ${plans.find(p => p.id === selectedPlan)?.price}`}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Secure payment via Razorpay. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
