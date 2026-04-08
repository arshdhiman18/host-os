import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { Search, Filter, Download, Plus, Eye, Trash2, Phone, X, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { BookingRowSkeleton } from '../../components/SkeletonLoader';

const PLATFORMS = ['All', 'Airbnb', 'Booking.com', 'Direct', 'Other'];
const platformColors = {
  Airbnb: '#FF5A5F',
  'Booking.com': '#003580',
  Direct: 'var(--color-primary)',
  Other: '#9CA3AF',
};

function GuestDetailModal({ booking, onClose }) {
  if (!booking) return null;
  return (
    <Modal isOpen={!!booking} onClose={onClose} title="Guest Details" size="md">
      <div className="space-y-4">
        {/* Guest avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: platformColors[booking.platform] || 'var(--color-primary)' }}>
            {booking.guestName[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base">{booking.guestName}</div>
            <div className="text-sm text-gray-400">{booking.platform}</div>
          </div>
        </div>

        <div className="divider" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Phone', value: booking.guestPhone || '—' },
            { label: 'Platform', value: booking.platform },
            { label: 'Guests', value: booking.numberOfGuests },
            { label: 'Days', value: booking.numberOfDays },
            { label: 'Check In', value: booking.checkIn ? format(new Date(booking.checkIn), 'dd MMM yyyy') : '—' },
            { label: 'Check Out', value: booking.checkOut ? format(new Date(booking.checkOut), 'dd MMM yyyy') : '—' },
            { label: 'Property', value: booking.propertyId?.name || '—' },
            { label: 'Purpose', value: booking.purpose || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>

        {/* Amount */}
        <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-xs text-gray-500 font-medium">Amount</div>
          <div className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
            {booking.amount ? `₹${booking.amount.toLocaleString('en-IN')}` : 'Not set'}
          </div>
          <div className={`text-xs font-semibold mt-0.5 ${booking.earningsStatus === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
            {booking.earningsStatus === 'confirmed' ? '✓ Confirmed' : '⚠ Pending'}
          </div>
        </div>

        {/* ID Proofs */}
        {booking.idProofs?.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 font-medium mb-2">ID Proofs ({booking.idProofs.length})</div>
            <div className="flex flex-wrap gap-2">
              {booking.idProofs.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                  <FileText size={13} />
                  Proof {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddBookingModal({ properties, onClose, onSaved }) {
  const [form, setForm] = useState({
    propertyId: properties[0]?._id || '',
    guestName: '', guestPhone: '', platform: 'Direct',
    checkIn: '', checkOut: '', numberOfGuests: 1,
    numberOfDays: 1, purpose: '', amount: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.guestName) {
      toast.error('Property and guest name are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/bookings', { ...form, amount: form.amount || null });
      toast.success('Booking added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Add Booking" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="input-group">
          <label className="label">Property</label>
          <select className="input" value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})}>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="label">Guest Name *</label>
          <input className="input" placeholder="Full name" value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group">
            <label className="label">Phone</label>
            <input className="input" placeholder="Phone" inputMode="tel" value={form.guestPhone} onChange={e => setForm({...form, guestPhone: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="label">Platform</label>
            <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
              {['Airbnb', 'Booking.com', 'Direct', 'Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group">
            <label className="label">Check In</label>
            <input type="date" className="input" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="label">Check Out</label>
            <input type="date" className="input" value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group">
            <label className="label">Guests</label>
            <input type="number" min="1" className="input" value={form.numberOfGuests} onChange={e => setForm({...form, numberOfGuests: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="label">Days</label>
            <input type="number" min="1" className="input" value={form.numberOfDays} onChange={e => setForm({...form, numberOfDays: e.target.value})} />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Amount (₹) <span className="text-gray-400 font-normal">optional</span></label>
          <input type="number" className="input" placeholder="Leave blank if unknown" inputMode="numeric" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Adding...' : 'Add Booking'}
        </button>
      </form>
    </Modal>
  );
}

export default function Guests() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', platform],
    queryFn: () => api.get(`/bookings${platform !== 'All' ? `?platform=${platform}` : ''}`).then(r => r.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      toast.success('Booking deleted');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this booking?')) deleteMutation.mutate(id);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/bookings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hostos-bookings.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  const filtered = bookingsData?.bookings?.filter(b =>
    !search || b.guestName.toLowerCase().includes(search.toLowerCase()) ||
    b.guestPhone?.includes(search)
  ) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Guests</h2>
          <p className="text-xs text-gray-400">{bookingsData?.total || 0} total bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <Download size={16} />
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm px-3 py-2 rounded-xl gap-1.5">
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              platform === p ? 'text-white shadow-card' : 'bg-white text-gray-500 border border-gray-200'
            }`}
            style={platform === p ? { background: 'var(--color-primary)' } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card space-y-1">
          {[...Array(5)].map((_, i) => <BookingRowSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No guests found</p>
          <p className="text-xs text-gray-300 mt-1">
            {search ? 'Try different search terms' : 'Share your property link to get guests'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <div
              key={b._id}
              className="card flex items-center gap-3 cursor-pointer hover:shadow-card-md transition-shadow"
              onClick={() => setSelectedBooking(b)}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: platformColors[b.platform] || 'var(--color-primary)', fontSize: '15px' }}>
                {b.guestName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{b.guestName}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                  {b.guestPhone && <span className="flex items-center gap-0.5"><Phone size={10} />{b.guestPhone}</span>}
                  <span>{b.platform}</span>
                  {b.propertyId?.name && <span>· {b.propertyId.name}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-1">
                {b.amount ? (
                  <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    ₹{b.amount.toLocaleString('en-IN')}
                  </div>
                ) : (
                  <span className="badge-warning text-xs">Pending</span>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {b.checkIn ? format(new Date(b.checkIn), 'MMM d') : format(new Date(b.createdAt), 'MMM d')}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(b._id); }}
                className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <GuestDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />

      {showAddModal && propertiesData?.properties && (
        <AddBookingModal
          properties={propertiesData.properties}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
          }}
        />
      )}
    </div>
  );
}
