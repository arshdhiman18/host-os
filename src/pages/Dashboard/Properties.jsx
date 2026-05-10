import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  Plus, Home, MapPin, Wifi, Copy, Share2, Trash2,
  Edit3, Link2, ChevronRight, Check, X, ExternalLink,
  ClipboardList, CheckSquare, Square, Users2, ChevronDown, ChevronUp,
  RefreshCw, CalendarDays, ArrowLeft, IndianRupee, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExpenseModal, { CATEGORY_META } from '../../components/ExpenseModal';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// ─── Property Form ────────────────────────────────────────────────────────────
function PropertyForm({ property, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: property?.name || '',
    location: property?.location || '',
    pricePerNight: property?.pricePerNight || '',
    wifiName: property?.wifiName || '',
    wifiPassword: property?.wifiPassword || '',
    instructions: property?.instructions || '',
    mapUrl: property?.mapUrl || '',
    airbnbIcalUrls: property?.airbnbIcalUrls?.length ? property.airbnbIcalUrls : [''],
    bookingIcalUrls: property?.bookingIcalUrls?.length ? property.bookingIcalUrls : [''],
  });

  const updateIcalUrl = (platform, index, value) => {
    const key = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
    const updated = [...form[key]];
    updated[index] = value;
    setForm({ ...form, [key]: updated });
  };

  const addIcalUrl = (platform) => {
    const key = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
    setForm({ ...form, [key]: [...form[key], ''] });
  };

  const removeIcalUrl = (platform, index) => {
    const key = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
    const updated = form[key].filter((_, i) => i !== index);
    setForm({ ...form, [key]: updated.length ? updated : [''] });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Property name is required'); return; }
    setLoading(true);
    try {
      if (property) {
        await api.put(`/properties/${property._id}`, form);
        toast.success('Property updated');
      } else {
        await api.post('/properties', form);
        toast.success('Property added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="input-group" key={key}>
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea className="input resize-none" rows={3} placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      ) : (
        <input type={type} className="input" placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <Modal isOpen title={property ? 'Edit Property' : 'Add Property'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        {field('name', 'Property Name *', 'text', 'My Airbnb Villa')}
        {field('location', 'Location', 'text', 'Goa, India')}
        {field('pricePerNight', 'Price per Night (₹)', 'number', 'Optional')}
        <div className="divider" />
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest Info (shown after check-in)</div>
        {field('wifiName', 'WiFi Name', 'text', 'HomeNetwork_5G')}
        {field('wifiPassword', 'WiFi Password', 'text', '••••••••')}
        {field('instructions', 'Check-in Instructions', 'textarea', 'Key is under the mat...')}
        {field('mapUrl', 'Google Maps URL', 'url', 'https://maps.google.com/...')}
        <div className="divider" />
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">iCal Sync (optional)</div>
        <div className="text-xs text-gray-400 -mt-1">
          Add one URL per Airbnb/Booking.com listing. Multiple listings can map to this one property.
        </div>
        <div className="space-y-2">
          <label className="label" style={{ color: '#FF5A5F' }}>Airbnb iCal URLs</label>
          {form.airbnbIcalUrls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="url" className="input flex-1 text-xs"
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={url} onChange={e => updateIcalUrl('Airbnb', i, e.target.value)} />
              {form.airbnbIcalUrls.length > 1 && (
                <button type="button" onClick={() => removeIcalUrl('Airbnb', i)}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addIcalUrl('Airbnb')}
            className="text-xs font-semibold flex items-center gap-1" style={{ color: '#FF5A5F' }}>
            <Plus size={12} /> Add another Airbnb URL
          </button>
        </div>
        <div className="space-y-2">
          <label className="label" style={{ color: '#0071C2' }}>Booking.com iCal URLs</label>
          {form.bookingIcalUrls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="url" className="input flex-1 text-xs"
                placeholder="https://admin.booking.com/hotel/ical/..."
                value={url} onChange={e => updateIcalUrl('Booking.com', i, e.target.value)} />
              {form.bookingIcalUrls.length > 1 && (
                <button type="button" onClick={() => removeIcalUrl('Booking.com', i)}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addIcalUrl('Booking.com')}
            className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0071C2' }}>
            <Plus size={12} /> Add another Booking.com URL
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Saving...' : property ? 'Save Changes' : 'Add Property'}
        </button>
      </form>
    </Modal>
  );
}

// ─── Share Link Modal ─────────────────────────────────────────────────────────
function ShareLinkModal({ property, onClose }) {
  const [copied, setCopied] = useState(false);
  const guestUrl = `${window.location.origin}/g/${property.guestLinkToken}`;

  const copy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const shareWhatsApp = () => {
    const text = `Hi! Please fill in your check-in details here: ${guestUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal isOpen title="Share Guest Link" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">Guest link for</div>
          <div className="font-bold text-gray-900">{property.name}</div>
        </div>
        <div className="relative">
          <div className="input text-xs text-gray-500 pr-12 overflow-hidden text-ellipsis whitespace-nowrap bg-gray-50">
            {guestUrl}
          </div>
          <button onClick={copy}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={copy} className="btn-secondary py-3 text-sm gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors">
            <Share2 size={16} /> WhatsApp
          </button>
        </div>
        <a href={guestUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-semibold py-2"
          style={{ color: 'var(--color-primary)' }}>
          <ExternalLink size={14} /> Preview guest form
        </a>
        <div className="text-xs text-gray-400 text-center leading-relaxed">
          Share this link with guests via WhatsApp, SMS, or any messaging app.
        </div>
      </div>
    </Modal>
  );
}

// ─── Co-Host Request Modal ────────────────────────────────────────────────────
function CoHostModal({ onClose, existingRequest }) {
  const [form, setForm] = useState({ totalProperties: '', propertiesNeedingPM: '', locations: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRequest);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.totalProperties || !form.propertiesNeedingPM) { toast.error('Please fill in all required fields'); return; }
    setLoading(true);
    try {
      await api.post('/cohost', form);
      setSubmitted(true);
      toast.success('Request submitted! Our team will contact you soon.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Get a Co-Host / Property Manager" onClose={onClose} size="md">
      {submitted || existingRequest ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--color-primary-light)' }}>
            <Users2 size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Request Received!</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Our team will review your request and reach out within <strong>48 hours</strong>.
            </p>
          </div>
          {existingRequest && (
            <div className="rounded-xl p-3 text-left text-xs space-y-1" style={{ background: 'var(--color-primary-light)' }}>
              <div><span className="text-gray-500">Status:</span> <span className="font-bold capitalize" style={{ color: 'var(--color-primary)' }}>{existingRequest.status}</span></div>
              <div><span className="text-gray-500">Properties needing PM:</span> <span className="font-semibold text-gray-800">{existingRequest.propertiesNeedingPM}</span></div>
            </div>
          )}
          <button onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--color-primary-light)' }}>
            <p className="text-sm font-semibold text-gray-700 leading-relaxed">
              Struggling to manage your properties? Let us connect you with a verified co-host or property manager.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">Total Properties *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 3"
                  value={form.totalProperties} onChange={e => setForm({ ...form, totalProperties: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="label">Need PM for *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 2"
                  value={form.propertiesNeedingPM} onChange={e => setForm({ ...form, propertiesNeedingPM: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label className="label">Property Locations</label>
              <input type="text" className="input" placeholder="e.g. Goa, Mumbai"
                value={form.locations} onChange={e => setForm({ ...form, locations: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="label">Additional Notes</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Any specific requirements..."
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center">Someone from our team will contact you within 48 hours.</p>
        </div>
      )}
    </Modal>
  );
}

// ─── iCal Sync Modal ──────────────────────────────────────────────────────────
function IcalSyncModal({ property, onClose }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState({ Airbnb: false, 'Booking.com': false });
  const [results, setResults] = useState({});

  const syncPlatform = async (platform) => {
    const urlsField = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
    const urls = (property[urlsField] || []).filter(u => u.trim());
    if (!urls.length) return toast.error(`No ${platform} iCal URLs saved. Edit the property to add them.`);
    setSyncing(s => ({ ...s, [platform]: true }));
    try {
      const { data } = await api.post(`/import/ical/${property._id}`, { platform, urls });
      setResults(r => ({ ...r, [platform]: data }));
      if (data.created > 0) {
        queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
        toast.success(`${data.created} new booking${data.created !== 1 ? 's' : ''} synced from ${platform}`);
      } else {
        toast.success(`${platform} is up to date — no new bookings`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `${platform} sync failed`);
    } finally {
      setSyncing(s => ({ ...s, [platform]: false }));
    }
  };

  const PLATFORM_COLORS = { Airbnb: '#FF5A5F', 'Booking.com': '#0071C2' };

  return (
    <Modal isOpen title="Sync iCal Bookings" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-xs text-gray-500 font-medium">Property</div>
          <div className="font-bold text-gray-900">{property.name}</div>
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          Syncs all date blocks from every iCal URL. For guest names and amounts, use CSV import.
        </div>
        {['Airbnb', 'Booking.com'].map(platform => {
          const urlsField = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
          const urls = (property[urlsField] || []).filter(u => u.trim());
          const result = results[platform];
          const isSyncing = syncing[platform];
          return (
            <div key={platform} className="rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: PLATFORM_COLORS[platform] }}>
                  {platform}
                  {urls.length > 0 && <span className="ml-1.5 text-xs font-normal text-gray-400">{urls.length} URL{urls.length !== 1 ? 's' : ''}</span>}
                </span>
                <button onClick={() => syncPlatform(platform)} disabled={isSyncing || !urls.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 active:scale-95"
                  style={{ background: urls.length ? PLATFORM_COLORS[platform] : '#D1D5DB' }}>
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Sync All'}
                </button>
              </div>
              {urls.length > 0 ? (
                <div className="space-y-1">
                  {urls.map((url, i) => (
                    <div key={i} className="text-xs text-gray-400 truncate bg-gray-50 rounded-lg px-2 py-1">{url}</div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium">No URLs added — edit property to add iCal URLs</div>
              )}
              {result && (
                <div className="flex gap-3 text-xs pt-1 border-t border-gray-50">
                  <span className="text-green-600 font-semibold">{result.created} new</span>
                  <span className="text-gray-400">{result.skipped} skipped</span>
                  <span className="text-gray-400">{result.totalEvents} total events</span>
                  {result.failedUrls?.length > 0 && <span className="text-red-400">{result.failedUrls.length} URL{result.failedUrls.length !== 1 ? 's' : ''} failed</span>}
                </div>
              )}
            </div>
          );
        })}
        <div className="rounded-xl p-3 space-y-1" style={{ background: '#FFF7ED' }}>
          <div className="text-xs font-semibold text-orange-600">Test URLs (localhost only)</div>
          {['beach-house-entire', 'beach-house-room', 'beach-house-studio', 'mountain-villa', 'city-apartment'].map(name => (
            <div key={name} className="text-xs text-orange-500 font-mono truncate">
              http://localhost:5000/ical/{name}.ics
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Property Detail View ─────────────────────────────────────────────────────
function PropertyDetail({ property, properties, onBack, onEdit, onSync, onShare, onTodosUpdate }) {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: expensesData, refetch: refetchExpenses } = useQuery({
    queryKey: ['property-expenses', property._id],
    queryFn: () => api.get(`/expenses?type=property&propertyId=${property._id}`).then(r => r.data),
  });
  const expenses = expensesData?.expenses || [];

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    setAddingTodo(true);
    try {
      const { data } = await api.post(`/properties/${property._id}/todos`, { text: newTodo.trim() });
      onTodosUpdate(property._id, data.todos);
      setNewTodo('');
    } catch { toast.error('Failed to add task'); }
    finally { setAddingTodo(false); }
  };

  const toggleTodo = async (todoId, done) => {
    try {
      const { data } = await api.patch(`/properties/${property._id}/todos/${todoId}`, { done: !done });
      onTodosUpdate(property._id, data.todos);
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTodo = async (todoId) => {
    try {
      const { data } = await api.delete(`/properties/${property._id}/todos/${todoId}`);
      onTodosUpdate(property._id, data.todos);
    } catch { toast.error('Failed to delete task'); }
  };

  const deleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      refetchExpenses();
      queryClient.invalidateQueries({ queryKey: ['profit'] });
      toast.success('Expense deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const hasIcal = property.airbnbIcalUrls?.some(u => u.trim()) || property.bookingIcalUrls?.some(u => u.trim());
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-gray-900 truncate">{property.name}</h2>
          {property.location && <p className="text-xs text-gray-400">{property.location}</p>}
        </div>
        <button onClick={() => onEdit(property)}
          className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5 flex-shrink-0">
          <Edit3 size={14} /> Edit
        </button>
      </div>

      {/* Property Info */}
      <div className="card space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Info</div>
        {property.pricePerNight && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Price/night</span>
            <span className="font-bold" style={{ color: 'var(--color-primary)' }}>₹{property.pricePerNight.toLocaleString('en-IN')}</span>
          </div>
        )}
        {property.wifiName && (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-gray-50">
            <Wifi size={13} className="text-gray-400" />
            <span className="font-medium text-gray-700">{property.wifiName}</span>
            {property.wifiPassword && <><span className="text-gray-300">·</span><span className="text-gray-500">{property.wifiPassword}</span></>}
          </div>
        )}
        {property.instructions && (
          <div>
            <div className="text-xs text-gray-400 font-medium mb-1">Check-in Instructions</div>
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{property.instructions}</div>
          </div>
        )}
        {property.mapUrl && (
          <a href={property.mapUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
            <ExternalLink size={13} /> View on Map
          </a>
        )}
        <button onClick={() => onShare(property)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <span className="flex items-center gap-2"><Link2 size={14} /> Share Guest Link</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* iCal Sync */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">iCal Sync</div>
          <button onClick={() => onSync(property)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: hasIcal ? '#FFF7ED' : '#F3F4F6', color: hasIcal ? '#F97316' : '#9CA3AF' }}>
            <RefreshCw size={12} /> {hasIcal ? 'Sync Now' : 'Add URLs & Sync'}
          </button>
        </div>
        {['Airbnb', 'Booking.com'].map(platform => {
          const field = platform === 'Airbnb' ? 'airbnbIcalUrls' : 'bookingIcalUrls';
          const urls = (property[field] || []).filter(u => u.trim());
          const color = platform === 'Airbnb' ? '#FF5A5F' : '#0071C2';
          return (
            <div key={platform} className="mb-2">
              <span className="text-xs font-semibold" style={{ color }}>{platform}</span>
              {urls.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {urls.map((url, i) => (
                    <div key={i} className="text-xs text-gray-400 truncate bg-gray-50 rounded-lg px-2 py-1">{url}</div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 ml-2">No URLs — click Edit to add</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Todos */}
      <div className="card">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tasks</div>
        <div className="space-y-1.5">
          {(property.todos || []).length === 0 && (
            <p className="text-xs text-gray-400">No tasks yet</p>
          )}
          {(property.todos || []).map(todo => (
            <div key={todo._id} className="flex items-center gap-2 group">
              <button onClick={() => toggleTodo(todo._id, todo.done)}
                className="flex-shrink-0 transition-colors"
                style={{ color: todo.done ? 'var(--color-primary)' : '#D1D5DB' }}>
                {todo.done ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className={`flex-1 text-xs ${todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo._id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-primary-500 bg-white"
            placeholder="Add a task…"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
          />
          <button onClick={addTodo} disabled={!newTodo.trim() || addingTodo}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Property Expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Expenses</div>
            {expenses.length > 0 && (
              <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-accent)' }}>
                Total: ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
            )}
          </div>
          <button onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={12} /> Add
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="text-xs text-gray-400">No expenses added yet</p>
        ) : (
          <div className="space-y-2">
            {expenses.map(exp => {
              const meta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
              const Icon = meta.icon;
              return (
                <div key={exp._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}15` }}>
                    <Icon size={13} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{exp.description}</div>
                    <div className="text-xs text-gray-400">
                      {exp.category} · {exp.date ? format(new Date(exp.date), 'dd MMM yyyy') : ''}
                    </div>
                  </div>
                  <div className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                  <button onClick={() => deleteExpense(exp._id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showExpenseModal && (
        <ExpenseModal
          defaultType="property"
          defaultPropertyId={property._id}
          properties={properties}
          onClose={() => setShowExpenseModal(false)}
          onSaved={() => {
            refetchExpenses();
            queryClient.invalidateQueries({ queryKey: ['profit'] });
          }}
        />
      )}
    </div>
  );
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property, onEdit, onShare, onDelete, onSync, onAddExpense, onViewDetail }) {
  const hasIcal = property.airbnbIcalUrls?.some(u => u.trim()) || property.bookingIcalUrls?.some(u => u.trim());
  const pendingTodos = (property.todos || []).filter(t => !t.done);

  return (
    <div className="card animate-fade-in-up">
      {/* Clickable main area */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={onViewDetail}>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-primary-light)' }}>
            <Home size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          {pendingTodos.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontSize: 9 }}>
                {pendingTodos.length > 9 ? '9+' : pendingTodos.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 truncate">{property.name}</div>
          {property.location && (
            <div className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
              <MapPin size={10} /> {property.location}
            </div>
          )}
          {property.pricePerNight && (
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>
              ₹{property.pricePerNight.toLocaleString('en-IN')}/night
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50"
        onClick={e => e.stopPropagation()}>
        <button onClick={() => onShare(property)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          <Copy size={11} /> Copy Link
        </button>
        <button onClick={() => onAddExpense(property)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
          <IndianRupee size={11} /> Add Expense
        </button>
        {hasIcal && (
          <button onClick={() => onSync(property)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#FFF7ED', color: '#F97316' }}>
            <RefreshCw size={11} /> Sync
          </button>
        )}
        <div className="flex-1" />
        <button onClick={() => onEdit(property)}
          className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Edit3 size={13} />
        </button>
        <button onClick={() => onDelete(property._id)}
          className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Properties() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [shareProperty, setShareProperty] = useState(null);
  const [syncProperty, setSyncProperty] = useState(null);
  const [showCoHostModal, setShowCoHostModal] = useState(false);
  const [detailPropertyId, setDetailPropertyId] = useState(null);
  const [expenseProperty, setExpenseProperty] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const { data: coHostData } = useQuery({
    queryKey: ['cohost-my'],
    queryFn: () => api.get('/cohost/my').then(r => r.data),
  });

  const properties = data?.properties || [];
  const detailProperty = properties.find(p => p._id === detailPropertyId);

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); toast.success('Property removed'); },
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this property? All bookings remain.')) deleteMutation.mutate(id);
  };

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['properties'] });

  const handleTodosUpdate = (propertyId, todos) => {
    queryClient.setQueryData(['properties'], (old) => {
      if (!old) return old;
      return { ...old, properties: old.properties.map(p => p._id === propertyId ? { ...p, todos } : p) };
    });
  };

  const existingCoHostRequest = coHostData?.request;

  // Show detail view if a property is selected
  if (detailPropertyId && detailProperty) {
    return (
      <div className="animate-fade-in">
        <PropertyDetail
          property={detailProperty}
          properties={properties}
          onBack={() => setDetailPropertyId(null)}
          onEdit={(p) => { setEditProperty(p); setShowForm(true); }}
          onSync={setSyncProperty}
          onShare={setShareProperty}
          onTodosUpdate={handleTodosUpdate}
        />
        {showForm && (
          <PropertyForm
            property={editProperty}
            onClose={() => { setShowForm(false); setEditProperty(null); }}
            onSaved={handleSaved}
          />
        )}
        {shareProperty && <ShareLinkModal property={shareProperty} onClose={() => setShareProperty(null)} />}
        {syncProperty && <IcalSyncModal property={syncProperty} onClose={() => setSyncProperty(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Properties</h2>
          <p className="text-xs text-gray-400">{properties.length} active</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-3 py-2 rounded-xl gap-1.5">
          <Plus size={16} /> Add Property
        </button>
      </div>

      {/* Co-Host CTA */}
      <button onClick={() => setShowCoHostModal(true)}
        className="w-full rounded-2xl p-4 flex items-center justify-between gap-3 transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Users2 size={20} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-sm">
              {existingCoHostRequest ? 'Co-Host Request Submitted' : 'Need a Property Manager?'}
            </div>
            <div className="text-white/80 text-xs mt-0.5">
              {existingCoHostRequest
                ? `Status: ${existingCoHostRequest.status} — Our team will contact you soon`
                : 'Get a verified co-host to manage your properties'}
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-white/70 flex-shrink-0" />
      </button>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <PropertyCardSkeleton key={i} />)}</div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-primary-light)' }}>
            <Home size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Add your first property</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            Create a property to get a unique guest link to share with your guests.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            <Plus size={16} /> Add Property
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(p => (
            <PropertyCard
              key={p._id}
              property={p}
              onEdit={(p) => { setEditProperty(p); setShowForm(true); }}
              onShare={setShareProperty}
              onDelete={handleDelete}
              onSync={setSyncProperty}
              onAddExpense={setExpenseProperty}
              onViewDetail={() => setDetailPropertyId(p._id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PropertyForm
          property={editProperty}
          onClose={() => { setShowForm(false); setEditProperty(null); }}
          onSaved={handleSaved}
        />
      )}
      {shareProperty && <ShareLinkModal property={shareProperty} onClose={() => setShareProperty(null)} />}
      {syncProperty && <IcalSyncModal property={syncProperty} onClose={() => setSyncProperty(null)} />}
      {showCoHostModal && (
        <CoHostModal
          onClose={() => { setShowCoHostModal(false); queryClient.invalidateQueries({ queryKey: ['cohost-my'] }); }}
          existingRequest={existingCoHostRequest}
        />
      )}
      {expenseProperty && (
        <ExpenseModal
          defaultType="property"
          defaultPropertyId={expenseProperty._id}
          properties={properties}
          onClose={() => setExpenseProperty(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['profit'] })}
        />
      )}
    </div>
  );
}
