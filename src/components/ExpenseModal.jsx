import React, { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Wrench, Sparkles, Zap, Users, TrendingUp, MoreHorizontal } from 'lucide-react';

export const CATEGORY_META = {
  Maintenance: { color: '#F97316', icon: Wrench },
  Cleaning:    { color: '#3B82F6', icon: Sparkles },
  Utilities:   { color: '#EAB308', icon: Zap },
  Staff:       { color: '#8B5CF6', icon: Users },
  Marketing:   { color: '#10B981', icon: TrendingUp },
  Other:       { color: '#6B7280', icon: MoreHorizontal },
};

export default function ExpenseModal({
  defaultType = 'property',
  defaultPropertyId = null,
  properties = [],
  onClose,
  onSaved,
}) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState(defaultType);
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'property') setPropertyId(defaultPropertyId || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) { toast.error('Enter a description'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (type === 'property' && !propertyId) { toast.error('Select a property'); return; }

    setLoading(true);
    try {
      await api.post('/expenses', {
        type,
        propertyId: type === 'property' ? propertyId : null,
        category,
        description: description.trim(),
        amount: Number(amount),
        date,
      });
      toast.success('Expense added ✓');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Add Expense" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'property', label: 'Property', desc: 'For a specific property' },
            { value: 'overall', label: 'Overall', desc: 'Shared across all properties' },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => handleTypeChange(opt.value)}
              className="p-3 rounded-xl border-2 text-left transition-all"
              style={type === opt.value
                ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' }
                : { borderColor: '#E5E7EB' }
              }
            >
              <div className="font-bold text-sm" style={{ color: type === opt.value ? 'var(--color-primary)' : '#374151' }}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Property selector */}
        {type === 'property' && (
          <div className="input-group">
            <label className="label">Property</label>
            {defaultPropertyId ? (
              <div className="input bg-gray-50 text-gray-700 text-sm font-medium">
                {properties.find(p => p._id === defaultPropertyId)?.name || 'Selected Property'}
              </div>
            ) : (
              <select className="input" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                <option value="">-- Select property --</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Category */}
        <div className="input-group">
          <label className="label">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CATEGORY_META).map(([key, { color, icon: Icon }]) => (
              <button key={key} type="button"
                onClick={() => setCategory(key)}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all"
                style={category === key
                  ? { borderColor: color, background: `${color}15` }
                  : { borderColor: '#F3F4F6' }
                }
              >
                <Icon size={15} style={{ color: category === key ? color : '#9CA3AF' }} />
                <span className="text-xs font-semibold" style={{ color: category === key ? color : '#6B7280' }}>
                  {key}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="label">Description</label>
          <input className="input" placeholder="e.g. AC repair, Maid salary"
            value={description} onChange={e => setDescription(e.target.value)} autoFocus />
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group">
            <label className="label">Amount (₹)</label>
            <input type="number" className="input" placeholder="0" inputMode="numeric"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Add Expense'}
        </button>
      </form>
    </Modal>
  );
}
