import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  IndianRupee, CheckCircle, AlertCircle,
  Plus, Download, Upload, ArrowRight, ArrowLeft, Check, Pencil, Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const PLATFORM_COLORS = {
  Airbnb: '#FF5A5F',
  'Booking.com': '#0071C2',
  Direct: '#509B8D',
  Other: '#6B7280',
  Manual: '#8B5CF6',
};

function EditBookingModal({ booking, onClose, onSaved }) {
  const [amount, setAmount] = useState(booking?.amount?.toString() || '');
  const [phone, setPhone] = useState(booking?.guestPhone || '');
  const [loading, setLoading] = useState(false);
  const isPending = booking?.earningsStatus === 'pending';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPending && (!amount || isNaN(amount) || Number(amount) <= 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const body = { guestPhone: phone.trim() };
      if (amount && !isNaN(amount) && Number(amount) > 0) {
        body.amount = Number(amount);
        body.earningsStatus = 'confirmed';
      }
      await api.put(`/bookings/${booking._id}`, body);
      toast.success('Saved ✓');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title={isPending ? 'Add Amount & Phone' : 'Edit Booking'} onClose={onClose} size="sm">
      <div className="mb-4">
        <div className="font-semibold text-gray-900">{booking?.guestName}</div>
        <div className="text-sm text-gray-400">{booking?.platform} · {booking?.propertyId?.name}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="input-group">
          <label className="label">Amount (₹){!isPending && <span className="text-gray-400 font-normal ml-1">— optional</span>}</label>
          <input
            type="number"
            className="input text-lg font-bold"
            placeholder="e.g. 3500"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus={isPending}
          />
        </div>
        <div className="input-group">
          <label className="label flex items-center gap-1.5">
            <Phone size={13} /> Guest Phone
          </label>
          <input
            type="tel"
            className="input"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus={!isPending}
          />
          <p className="text-xs text-gray-400 mt-1">Saved for WhatsApp campaigns and guest follow-ups</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </Modal>
  );
}

function EarningRow({ booking, onEdit }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ background: booking.earningsStatus === 'confirmed' ? 'var(--color-primary)' : 'var(--color-accent)' }}
      >
        {booking.guestName[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">{booking.guestName}</div>
        <div className="text-xs text-gray-400 truncate flex items-center gap-1">
          <span
            className="px-1.5 py-0.5 rounded text-white font-medium"
            style={{ background: PLATFORM_COLORS[booking.platform] || '#6B7280', fontSize: '9px' }}
          >
            {booking.platform}
          </span>
          <span>{booking.propertyId?.name || '—'}</span>
          <span>·</span>
          <span>
            {booking.checkIn
              ? format(new Date(booking.checkIn), 'MMM d')
              : format(new Date(booking.createdAt), 'MMM d')}
          </span>
        </div>
        {booking.guestPhone && (
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Phone size={10} />
            {booking.guestPhone}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 text-right flex items-center gap-2">
        {booking.amount ? (
          <>
            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                ₹{booking.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-green-500 font-medium">Confirmed</div>
            </div>
            <button
              onClick={() => onEdit(booking)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit phone / amount"
            >
              <Pencil size={13} className="text-gray-400" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onEdit(booking)}
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

// ─── CSV Import Modal ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported, properties }) {
  const [step, setStep] = useState(1); // 1=platform, 2=upload, 3=map, 4=result
  const [platform, setPlatform] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { recognized, unrecognized, totalRows }
  const [mapping, setMapping] = useState({}); // { listingName: propertyId }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handlePreview = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('platform', platform);
      const { data } = await api.post('/import/csv/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data);
      if (data.unrecognized.length > 0) {
        // Pre-fill mapping for already recognized listings
        const m = {};
        data.recognized.forEach(r => { m[r.listingName] = r.propertyId; });
        setMapping(m);
        setStep(3);
      } else {
        // All recognized — go straight to confirm
        const m = {};
        data.recognized.forEach(r => { m[r.listingName] = r.propertyId; });
        setMapping(m);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    // Check all listings are mapped
    const allListings = preview?.listingNames || [];
    const unmapped = allListings.filter(n => !mapping[n]);
    if (unmapped.length > 0) {
      return toast.error(`Map all listings before importing (${unmapped.length} unmapped)`);
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('platform', platform);
      fd.append('mapping', JSON.stringify(mapping));
      const { data } = await api.post('/import/csv/confirm', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setStep(4);
      onImported();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const PLATFORM_COLORS = { Airbnb: '#FF5A5F', 'Booking.com': '#0071C2' };

  return (
    <Modal isOpen title="Import Bookings" onClose={onClose} size="md">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5">
        {['Platform', 'Upload', 'Map', 'Done'].map((label, i) => {
          const s = i + 1;
          const active = step === s;
          const done = step > s;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={done
                    ? { background: '#10B981', color: 'white' }
                    : active
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : { background: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  {done ? <Check size={12} /> : s}
                </div>
                <span className="text-xs font-medium hidden sm:block"
                  style={{ color: active ? 'var(--color-primary)' : '#9CA3AF' }}>
                  {label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Select platform */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Which platform is this export from?</p>
          <div className="grid grid-cols-2 gap-3">
            {['Airbnb', 'Booking.com'].map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className="py-5 rounded-2xl border-2 font-bold text-sm transition-all"
                style={platform === p
                  ? { borderColor: PLATFORM_COLORS[p], color: PLATFORM_COLORS[p], background: `${PLATFORM_COLORS[p]}10` }
                  : { borderColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                {p}
              </button>
            ))}
          </div>
          <button
            disabled={!platform}
            onClick={() => setStep(2)}
            className="btn-primary w-full gap-2 disabled:opacity-40"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Upload file */}
      {step === 2 && (
        <div className="space-y-4">
          <div
            className="rounded-xl p-2 text-xs font-semibold text-center"
            style={{ background: `${PLATFORM_COLORS[platform]}15`, color: PLATFORM_COLORS[platform] }}
          >
            Importing from {platform}
          </div>
          <p className="text-sm text-gray-500">
            Upload the CSV/Excel file you downloaded from {platform}'s earnings or reservations section.
          </p>
          <div
            className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            style={{ borderColor: file ? 'var(--color-primary)' : '#E5E7EB' }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} className="mx-auto mb-2" style={{ color: file ? 'var(--color-primary)' : '#D1D5DB' }} />
            {file ? (
              <>
                <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{file.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-gray-500">Tap to select file</div>
                <div className="text-xs text-gray-400 mt-0.5">CSV or Excel (.xlsx)</div>
              </>
            )}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 gap-1">
              <ArrowLeft size={15} /> Back
            </button>
            <button onClick={handlePreview} disabled={!file || loading} className="btn-primary flex-1 gap-1 disabled:opacity-40">
              {loading ? 'Reading...' : <><ArrowRight size={15} /> Continue</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Map listings */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Found <strong>{preview.totalRows}</strong> bookings across <strong>{preview.listingNames.length}</strong> listing{preview.listingNames.length !== 1 ? 's' : ''}.
            Map each listing to a property in HostOS.
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {preview.listingNames.map(name => {
              const isRecognized = preview.recognized.find(r => r.listingName === name);
              return (
                <div key={name} className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
                  <div className="text-xs font-bold text-gray-700 mb-2 truncate">{name}</div>
                  {isRecognized ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                      <Check size={12} /> Auto-matched to "{isRecognized.propertyName}"
                    </div>
                  ) : (
                    <select
                      className="input text-sm w-full"
                      value={mapping[name] || ''}
                      onChange={e => setMapping({ ...mapping, [name]: e.target.value })}
                    >
                      <option value="">-- Select your property --</option>
                      {properties.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-400">
            New mappings are saved — future imports auto-match these listings.
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 gap-1">
              <ArrowLeft size={15} /> Back
            </button>
            <button onClick={handleImport} disabled={loading} className="btn-primary flex-1 gap-1 disabled:opacity-40">
              {loading ? 'Importing...' : <><Upload size={15} /> Import</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}>
            <Check size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-gray-900">Import Complete</div>
            <div className="text-sm text-gray-500 mt-1">
              {result.imported} booking{result.imported !== 1 ? 's' : ''} imported from {platform}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Imported', value: result.imported, color: '#10B981' },
              { label: 'Skipped', value: result.skipped, color: '#F59E0B' },
              { label: 'Errors', value: result.errors, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center py-3">
                <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-gray-400">
              Skipped = already imported (deduped by confirmation code) or unmapped listings.
            </p>
          )}
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Modal>
  );
}

export default function Earnings() {
  const queryClient = useQueryClient();
  const [editBookingFor, setEditBookingFor] = useState(null);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Fetch properties for the selector
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });
  const properties = propertiesData?.properties || [];
  const selectedProperty = properties.find(p => p._id === selectedPropertyId);

  // Stats — scoped to selected property if any
  const statsParams = new URLSearchParams();
  if (selectedPropertyId) statsParams.set('propertyId', selectedPropertyId);

  const { data: stats } = useQuery({
    queryKey: ['booking-stats', selectedPropertyId],
    queryFn: () => api.get(`/bookings/stats?${statsParams}`).then(r => r.data),
  });

  // Bookings list — scoped to selected property + date filters
  const listParams = new URLSearchParams();
  if (filterStart) listParams.set('startDate', filterStart);
  if (filterEnd) listParams.set('endDate', filterEnd);
  if (selectedPropertyId) listParams.set('propertyId', selectedPropertyId);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings-earnings', filterStart, filterEnd, selectedPropertyId],
    queryFn: () => api.get(`/bookings?${listParams}&limit=200`).then(r => r.data),
  });

  const pendingBookings = bookingsData?.bookings?.filter(b => b.earningsStatus === 'pending') || [];
  const confirmedBookings = bookingsData?.bookings?.filter(b => b.earningsStatus === 'confirmed') || [];

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId);
      const response = await api.get(`/bookings/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostos-earnings-${selectedProperty ? selectedProperty.name + '-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleBookingSaved = () => {
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5"
          >
            <Upload size={15} />
            Import
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* Total stats — always all-properties */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <div className="text-xs text-gray-400 font-medium">
            {selectedProperty ? 'Property Total' : 'Total'}
          </div>
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

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 mb-2">Filter by property</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPropertyId('')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={!selectedPropertyId
                ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
              }
            >
              All Properties
            </button>
            {properties.map(p => (
              <button
                key={p._id}
                onClick={() => setSelectedPropertyId(selectedPropertyId === p._id ? '' : p._id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={selectedPropertyId === p._id
                  ? { background: 'var(--color-primary-dark)', color: 'white', borderColor: 'var(--color-primary-dark)' }
                  : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Platform breakdown — shown when a property is selected OR always if data exists */}
      {stats?.platformBreakdown?.length > 0 && (
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 mb-3">
            {selectedProperty ? `${selectedProperty.name} — by platform` : 'Earnings by platform'}
          </div>
          <div className="space-y-2.5">
            {stats.platformBreakdown.map(({ platform, total, count }) => {
              const maxTotal = stats.platformBreakdown[0]?.total || 1;
              const barWidth = Math.round((total / maxTotal) * 100);
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PLATFORM_COLORS[platform] || '#6B7280' }}
                      />
                      <span className="text-sm font-semibold text-gray-700">{platform}</span>
                      <span className="text-xs text-gray-400">{count} booking{count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: PLATFORM_COLORS[platform] || '#374151' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, background: PLATFORM_COLORS[platform] || '#6B7280' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <div className="relative mt-0.5">
                <input
                  type="date"
                  className="input text-sm w-full"
                  style={{ color: value ? 'var(--color-text-primary)' : 'transparent' }}
                  value={value}
                  onChange={e => setter(e.target.value)}
                />
                {!value && (
                  <span
                    className="absolute inset-0 flex items-center px-4 text-sm pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Select date
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {(filterStart || filterEnd) && (
          <button
            onClick={() => { setFilterStart(''); setFilterEnd(''); }}
            className="text-xs font-semibold mt-2"
            style={{ color: 'var(--color-primary)' }}
          >
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
              <EarningRow key={b._id} booking={b} onEdit={setEditBookingFor} />
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
              <EarningRow key={b._id} booking={b} onEdit={setEditBookingFor} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && bookingsData?.bookings?.length === 0 && (
        <div className="card text-center py-12">
          <IndianRupee size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No bookings found</p>
          <p className="text-xs text-gray-300 mt-1">Try adjusting the filters</p>
        </div>
      )}

      {editBookingFor && (
        <EditBookingModal
          booking={editBookingFor}
          onClose={() => setEditBookingFor(null)}
          onSaved={handleBookingSaved}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          properties={properties}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ['bookings-earnings'] });
            queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
          }}
        />
      )}
    </div>
  );
}
