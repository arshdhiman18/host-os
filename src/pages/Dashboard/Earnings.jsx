import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { IndianRupee, TrendingUp, CheckCircle, AlertCircle, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

function AddAmountModal({ booking, onClose, onSaved }) {
  const [amount, setAmount] = useState(booking?.amount?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/bookings/${booking._id}/amount`, { amount: Number(amount) });
      toast.success('Amount saved ✓');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save amount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Add Amount" onClose={onClose} size="sm">
      <div className="mb-4">
        <div className="font-semibold text-gray-900">{booking?.guestName}</div>
        <div className="text-sm text-gray-400">{booking?.platform} · {booking?.propertyId?.name}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="input-group">
          <label className="label">Amount (₹)</label>
          <input
            type="number"
            className="input text-lg font-bold"
            placeholder="e.g. 3500"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Save Amount'}
        </button>
      </form>
    </Modal>
  );
}

function EarningRow({ booking, onAddAmount }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ background: booking.earningsStatus === 'confirmed' ? 'var(--color-primary)' : 'var(--color-accent)' }}>
        {booking.guestName[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">{booking.guestName}</div>
        <div className="text-xs text-gray-400 truncate">
          {booking.platform} · {booking.propertyId?.name || '—'} ·{' '}
          {booking.checkIn ? format(new Date(booking.checkIn), 'MMM d') : format(new Date(booking.createdAt), 'MMM d')}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {booking.amount ? (
          <>
            <div className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
              ₹{booking.amount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-green-500 font-medium">Confirmed</div>
          </>
        ) : (
          <button
            onClick={() => onAddAmount(booking)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
            style={{ background: 'var(--color-accent)' }}
          >
            <Plus size={11} />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export default function Earnings() {
  const queryClient = useQueryClient();
  const [addAmountFor, setAddAmountFor] = useState(null);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: () => api.get('/bookings/stats').then(r => r.data),
  });

  const queryParams = new URLSearchParams();
  if (filterStart) queryParams.set('startDate', filterStart);
  if (filterEnd) queryParams.set('endDate', filterEnd);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings-earnings', filterStart, filterEnd],
    queryFn: () => api.get(`/bookings?${queryParams}&limit=100`).then(r => r.data),
  });

  const pendingBookings = bookingsData?.bookings?.filter(b => b.earningsStatus === 'pending') || [];
  const confirmedBookings = bookingsData?.bookings?.filter(b => b.earningsStatus === 'confirmed') || [];

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      const response = await api.get(`/bookings/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostos-earnings-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleAmountSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings-earnings'] });
    queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Earnings</h2>
          <p className="text-xs text-gray-400">Track and manage your income</p>
        </div>
        <button onClick={handleExport}
          className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5">
          <Download size={15} />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <div className="text-xs text-gray-400 font-medium">Total</div>
          <div className="text-lg font-extrabold" style={{ color: 'var(--color-primary)' }}>
            ₹{(stats?.totalEarnings || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-400 font-medium">This Month</div>
          <div className="text-lg font-extrabold" style={{ color: 'var(--color-primary-dark)' }}>
            ₹{(stats?.monthlyEarnings || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-400 font-medium">Avg/Booking</div>
          <div className="text-lg font-extrabold" style={{ color: 'var(--color-accent)' }}>
            ₹{(stats?.avgPerBooking || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Date filter */}
      <div className="card">
        <div className="text-xs font-semibold text-gray-500 mb-2">Filter by date</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'From', value: filterStart, setter: setFilterStart },
            { label: 'To', value: filterEnd, setter: setFilterEnd },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="text-xs text-gray-400">{label}</label>
              {/* Custom date input: shows placeholder text when empty (fixes iOS blank field) */}
              <div className="relative mt-0.5">
                <input
                  type="date"
                  className="input text-sm w-full"
                  style={{ color: value ? 'var(--color-text-primary)' : 'transparent' }}
                  value={value}
                  onChange={e => setter(e.target.value)}
                />
                {!value && (
                  <span className="absolute inset-0 flex items-center px-4 text-sm pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}>
                    Select date
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {(filterStart || filterEnd) && (
          <button onClick={() => { setFilterStart(''); setFilterEnd(''); }}
            className="text-xs font-semibold mt-2" style={{ color: 'var(--color-primary)' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Pending earnings */}
      {pendingBookings.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 className="section-title" style={{ color: 'var(--color-accent)' }}>
              Earnings Pending ({pendingBookings.length})
            </h3>
          </div>
          <div className="rounded-xl p-3 mb-3 text-sm text-amber-700"
            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            These bookings are missing an amount. Add the amount to confirm earnings.
          </div>
          <div className="divide-y divide-gray-50">
            {pendingBookings.map(b => (
              <EarningRow key={b._id} booking={b} onAddAmount={setAddAmountFor} />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed earnings */}
      {confirmedBookings.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-500" />
            <h3 className="section-title text-green-700">
              Confirmed Earnings ({confirmedBookings.length})
            </h3>
          </div>
          <div className="text-sm font-bold text-green-600 mb-3">
            Total: ₹{confirmedBookings.reduce((s, b) => s + (b.amount || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="divide-y divide-gray-50">
            {confirmedBookings.map(b => (
              <EarningRow key={b._id} booking={b} onAddAmount={setAddAmountFor} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && bookingsData?.bookings?.length === 0 && (
        <div className="card text-center py-12">
          <IndianRupee size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No bookings found</p>
          <p className="text-xs text-gray-300 mt-1">Try adjusting the date filter</p>
        </div>
      )}

      {addAmountFor && (
        <AddAmountModal
          booking={addAmountFor}
          onClose={() => setAddAmountFor(null)}
          onSaved={handleAmountSaved}
        />
      )}
    </div>
  );
}
