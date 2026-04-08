import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  Search, Download, Plus, Trash2, Phone,
  Users, FileText, ThumbsUp, ThumbsDown, MessageCircle, Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { BookingRowSkeleton } from '../../components/SkeletonLoader';

const PLATFORMS = ['All', 'Airbnb', 'Booking.com', 'Direct', 'Other'];
const RATINGS = ['All', 'Good', 'Bad'];
const platformColors = {
  Airbnb: '#FF5A5F', 'Booking.com': '#003580',
  Direct: 'var(--color-primary)', Other: '#9CA3AF',
};

const DEFAULT_TEMPLATE = `Hi {name}! 😊 Hope you enjoyed your stay at {property}. We'd love to welcome you back — book again for a special discount! Reply here to know more 🏡`;

const toWAPhone = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '91' + p.slice(1);
  if (p.length === 10) p = '91' + p;
  return p;
};

const buildWALink = (phone, name, property, template) => {
  const p = toWAPhone(phone);
  if (!p) return null;
  const msg = template.replace('{name}', name).replace('{property}', property || 'our property');
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
};

// ─── Message Template Modal ───────────────────────────────────────────────────
function MessageTemplateModal({ guests, onClose }) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);

  const handleSend = () => {
    const valid = guests.filter(g => g.guestPhone);
    if (!valid.length) { toast.error('No guests with phone numbers'); return; }
    valid.forEach((g, i) => {
      const link = buildWALink(g.guestPhone, g.guestName, g.propertyId?.name, template);
      if (link) setTimeout(() => window.open(link, '_blank'), i * 400);
    });
    toast.success(`Opening WhatsApp for ${valid.length} guest${valid.length > 1 ? 's' : ''}…`);
    onClose();
  };

  return (
    <Modal isOpen title="Message Good Guests" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-xl p-3 text-xs text-gray-500 bg-gray-50 leading-relaxed">
          Use <span className="font-bold text-gray-700">{'{name}'}</span> for guest name and{' '}
          <span className="font-bold text-gray-700">{'{property}'}</span> for property name.
        </div>
        <div className="input-group">
          <label className="label">Message Template</label>
          <textarea
            className="input resize-none text-sm leading-relaxed"
            rows={5}
            value={template}
            onChange={e => setTemplate(e.target.value)}
          />
        </div>
        <div className="rounded-xl p-3 bg-gray-50 text-xs text-gray-500">
          <div className="font-semibold text-gray-700 mb-1">Preview (first guest):</div>
          <div className="leading-relaxed">
            {template
              .replace('{name}', guests[0]?.guestName || 'Guest')
              .replace('{property}', guests[0]?.propertyId?.name || 'our property')}
          </div>
        </div>
        <button onClick={handleSend} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors">
          <MessageCircle size={16} />
          Send to {guests.length} Good Guest{guests.length > 1 ? 's' : ''}
        </button>
      </div>
    </Modal>
  );
}

// ─── Guest Detail Modal ───────────────────────────────────────────────────────
function GuestDetailModal({ booking, onClose, onRatingChange, msgTemplate }) {
  if (!booking) return null;
  const link = buildWALink(booking.guestPhone, booking.guestName, booking.propertyId?.name, msgTemplate);

  return (
    <Modal isOpen={!!booking} onClose={onClose} title="Guest Details" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: platformColors[booking.platform] || 'var(--color-primary)' }}>
            {booking.guestName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-base">{booking.guestName}</div>
            <div className="text-sm text-gray-400">{booking.platform}</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Rate:</span>
          <button onClick={() => onRatingChange(booking._id, booking.guestRating === 'good' ? null : 'good')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${booking.guestRating === 'good' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            <ThumbsUp size={12} /> Good
          </button>
          <button onClick={() => onRatingChange(booking._id, booking.guestRating === 'bad' ? null : 'bad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${booking.guestRating === 'bad' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 border border-red-200'}`}>
            <ThumbsDown size={12} /> Bad
          </button>
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

        <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-xs text-gray-500 font-medium">Amount</div>
          <div className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
            {booking.amount ? `₹${booking.amount.toLocaleString('en-IN')}` : 'Not set'}
          </div>
          <div className={`text-xs font-semibold mt-0.5 ${booking.earningsStatus === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
            {booking.earningsStatus === 'confirmed' ? '✓ Confirmed' : '⚠ Pending'}
          </div>
        </div>

        {booking.idProofs?.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 font-medium mb-2">ID Proofs ({booking.idProofs.length})</div>
            <div className="flex flex-wrap gap-2">
              {booking.idProofs.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                  <FileText size={13} /> Proof {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors">
            <MessageCircle size={16} /> Send WhatsApp Message
          </a>
        )}
      </div>
    </Modal>
  );
}

// ─── Add Booking Modal ────────────────────────────────────────────────────────
function AddBookingModal({ properties, onClose, onSaved }) {
  const [form, setForm] = useState({
    propertyId: properties[0]?._id || '', guestName: '', guestPhone: '',
    platform: 'Direct', checkIn: '', checkOut: '',
    numberOfGuests: 1, numberOfDays: 1, purpose: '', amount: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.guestName) { toast.error('Property and guest name are required'); return; }
    setLoading(true);
    try {
      await api.post('/bookings', { ...form, amount: form.amount || null });
      toast.success('Booking added'); onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Add Booking" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="input-group"><label className="label">Property</label>
          <select className="input" value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})}>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select></div>
        <div className="input-group"><label className="label">Guest Name *</label>
          <input className="input" placeholder="Full name" value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group"><label className="label">Phone</label>
            <input className="input" placeholder="Phone" inputMode="tel" value={form.guestPhone} onChange={e => setForm({...form, guestPhone: e.target.value})} /></div>
          <div className="input-group"><label className="label">Platform</label>
            <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
              {['Airbnb', 'Booking.com', 'Direct', 'Other'].map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group"><label className="label">Check In</label>
            <input type="date" className="input" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} /></div>
          <div className="input-group"><label className="label">Check Out</label>
            <input type="date" className="input" value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="input-group"><label className="label">Guests</label>
            <input type="number" min="1" className="input" value={form.numberOfGuests} onChange={e => setForm({...form, numberOfGuests: e.target.value})} /></div>
          <div className="input-group"><label className="label">Days</label>
            <input type="number" min="1" className="input" value={form.numberOfDays} onChange={e => setForm({...form, numberOfDays: e.target.value})} /></div>
        </div>
        <div className="input-group"><label className="label">Amount (₹) <span className="text-gray-400 font-normal">optional</span></label>
          <input type="number" className="input" placeholder="Leave blank if unknown" inputMode="numeric" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">{loading ? 'Adding...' : 'Add Booking'}</button>
      </form>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Guests() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgTemplate] = useState(DEFAULT_TEMPLATE);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', platform],
    queryFn: () => api.get(`/bookings?limit=200${platform !== 'All' ? `&platform=${platform}` : ''}`).then(r => r.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Deleted'); },
  });

  const ratingMutation = useMutation({
    mutationFn: ({ id, rating }) => api.patch(`/bookings/${id}/rating`, { rating }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (selectedBooking?._id === res.data.booking._id) setSelectedBooking(res.data.booking);
    },
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/bookings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'hostos-bookings.xlsx'; a.click();
      window.URL.revokeObjectURL(url); toast.success('Downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const goodGuests = (bookingsData?.bookings || []).filter(b => b.guestRating === 'good');

  const filtered = (bookingsData?.bookings || []).filter(b => {
    const matchSearch = !search || b.guestName.toLowerCase().includes(search.toLowerCase()) || b.guestPhone?.includes(search);
    const matchRating = ratingFilter === 'All' || (ratingFilter === 'Good' && b.guestRating === 'good') || (ratingFilter === 'Bad' && b.guestRating === 'bad');
    return matchSearch && matchRating;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Guests</h2>
          <p className="text-xs text-gray-400">{bookingsData?.total || 0} total bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <Download size={16} />
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-3 py-2 rounded-xl gap-1.5">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Message Good Guests CTA */}
      {goodGuests.length > 0 && (
        <button onClick={() => setShowMsgModal(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors active:scale-95">
          <span className="flex items-center gap-2"><MessageCircle size={16} /> Message Good Guests via WhatsApp</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{goodGuests.length} guest{goodGuests.length > 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${platform === p ? 'text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              style={platform === p ? { background: 'var(--color-primary)' } : {}}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {RATINGS.map(r => (
            <button key={r} onClick={() => setRatingFilter(r)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                ratingFilter === r
                  ? r === 'Good' ? 'bg-green-500 text-white border-green-500'
                    : r === 'Bad' ? 'bg-red-500 text-white border-red-500'
                    : 'text-white border-transparent'
                  : r === 'Good' ? 'bg-green-50 text-green-600 border-green-200'
                    : r === 'Bad' ? 'bg-red-50 text-red-500 border-red-200'
                    : 'bg-white text-gray-500 border-gray-200'
              }`}
              style={ratingFilter === r && r === 'All' ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}>
              {r === 'Good' && <ThumbsUp size={11} />}
              {r === 'Bad' && <ThumbsDown size={11} />}
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card space-y-1">{[...Array(5)].map((_, i) => <BookingRowSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No guests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b._id} className="card cursor-pointer hover:shadow-card-md transition-shadow"
              onClick={() => setSelectedBooking(b)}>
              {/* Row 1: avatar + name + amount */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"
                  style={{ background: platformColors[b.platform] || 'var(--color-primary)' }}>
                  {b.guestName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">{b.guestName}</span>
                    {b.guestRating === 'good' && <ThumbsUp size={11} className="text-green-500 flex-shrink-0" />}
                    {b.guestRating === 'bad' && <ThumbsDown size={11} className="text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {b.platform}{b.propertyId?.name ? ` · ${b.propertyId.name}` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {b.amount
                    ? <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{b.amount.toLocaleString('en-IN')}</div>
                    : <span className="badge-warning text-xs">Pending</span>}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {b.checkIn ? format(new Date(b.checkIn), 'MMM d') : format(new Date(b.createdAt), 'MMM d')}
                  </div>
                </div>
              </div>

              {/* Row 2: actions */}
              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-50"
                onClick={e => e.stopPropagation()}>
                {/* WhatsApp */}
                {toWAPhone(b.guestPhone) && (
                  <a href={buildWALink(b.guestPhone, b.guestName, b.propertyId?.name, msgTemplate)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-semibold hover:bg-green-500 hover:text-white transition-colors">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
                <div className="flex-1" />
                {/* Rating */}
                <button onClick={() => ratingMutation.mutate({ id: b._id, rating: b.guestRating === 'good' ? null : 'good' })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${b.guestRating === 'good' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-green-600'}`}>
                  <ThumbsUp size={12} /> Good
                </button>
                <button onClick={() => ratingMutation.mutate({ id: b._id, rating: b.guestRating === 'bad' ? null : 'bad' })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${b.guestRating === 'bad' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}>
                  <ThumbsDown size={12} /> Bad
                </button>
                <button onClick={() => { if (window.confirm('Delete?')) deleteMutation.mutate(b._id); }}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GuestDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)}
        onRatingChange={(id, r) => ratingMutation.mutate({ id, rating: r })} msgTemplate={msgTemplate} />

      {showMsgModal && (
        <MessageTemplateModal guests={goodGuests} onClose={() => setShowMsgModal(false)} />
      )}

      {showAddModal && propertiesData?.properties && (
        <AddBookingModal properties={propertiesData.properties} onClose={() => setShowAddModal(false)}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); queryClient.invalidateQueries({ queryKey: ['booking-stats'] }); }} />
      )}
    </div>
  );
}
