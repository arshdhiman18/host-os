import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  TrendingUp, TrendingDown, AlertTriangle, IndianRupee,
  Download, Upload, ArrowRight, ArrowLeft, Check, Trash2,
  Plus, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExpenseModal, { CATEGORY_META } from '../../components/ExpenseModal';

const PLATFORM_COLORS = {
  Airbnb: '#FF5A5F', 'Booking.com': '#0071C2',
  Direct: '#509B8D', Other: '#6B7280', Manual: '#8B5CF6',
};

const STATUS_CFG = {
  Profitable:    { dot: '#10B981', bg: '#DCFCE7', text: '#166534' },
  'Low Margin':  { dot: '#F59E0B', bg: '#FEF9C3', text: '#854D0E' },
  'Loss-Making': { dot: '#EF4444', bg: '#FEE2E2', text: '#991B1B' },
};

const RANGE_LABELS = { '3m': 'Last 3 months', '6m': 'Last 6 months', year: 'This year', all: 'All time' };

function getDateRange(range) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (range === '3m')   return { start: fmt(new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate())), end: today };
  if (range === '6m')   return { start: fmt(new Date(now.getFullYear(), now.getMonth() - 6,  now.getDate())), end: today };
  if (range === 'year') return { start: `${now.getFullYear()}-01-01`, end: today };
  return { start: '', end: '' };
}

// Desktop: compact dropdown next to Import/Export
function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
        <SlidersHorizontal size={14} className="text-gray-500" />
        {RANGE_LABELS[value]}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-100 rounded-2xl shadow-card-md z-20 overflow-hidden">
            {Object.entries(RANGE_LABELS).map(([k, label]) => (
              <button key={k} onClick={() => { onChange(k); setOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-between"
                style={{ color: value === k ? 'var(--color-primary)' : '#374151' }}>
                {label}
                {value === k && <Check size={13} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Mobile: full overlay modal for range selection
function RangeModal({ value, onChange, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full" onClick={e => e.stopPropagation()}>
        {/* Faded backdrop */}
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        {/* Bottom sheet */}
        <div className="relative bg-white rounded-t-3xl shadow-card-lg pb-8">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <span className="text-base font-bold text-gray-900">Filter by Period</span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="px-4 pt-2">
            {Object.entries(RANGE_LABELS).map(([k, label]) => (
              <button key={k} onClick={() => { onChange(k); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-colors"
                style={value === k ? { background: 'var(--color-primary-light)' } : {}}>
                <span className="text-base font-semibold"
                  style={{ color: value === k ? 'var(--color-primary)' : '#374151' }}>
                  {label}
                </span>
                {value === k && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    <Check size={13} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported, properties }) {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileChange = e => { const f = e.target.files?.[0]; if (f) setFile(f); };

  const handlePreview = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('platform', platform);
      const { data } = await api.post('/import/csv/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const m = {}; data.recognized.forEach(r => { m[r.listingName] = r.propertyId; });
      setPreview(data); setMapping(m); setStep(3);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not read file'); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    const unmapped = (preview?.listingNames || []).filter(n => !mapping[n]);
    if (unmapped.length) return toast.error(`Map all listings first (${unmapped.length} unmapped)`);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('platform', platform); fd.append('mapping', JSON.stringify(mapping));
      const { data } = await api.post('/import/csv/confirm', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data); setStep(4); onImported();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    finally { setLoading(false); }
  };

  const PL = { Airbnb: '#FF5A5F', 'Booking.com': '#0071C2' };

  return (
    <Modal isOpen title="Import Bookings" onClose={onClose} size="md">
      <div className="flex items-center gap-1 mb-5">
        {['Platform', 'Upload', 'Map', 'Done'].map((label, i) => {
          const s = i + 1; const active = step === s; const done = step > s;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={done ? { background: '#10B981', color: '#fff' } : active ? { background: 'var(--color-primary)', color: '#fff' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
                  {done ? <Check size={12} /> : s}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: active ? 'var(--color-primary)' : '#9CA3AF' }}>{label}</span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Which platform is this export from?</p>
          <div className="grid grid-cols-2 gap-3">
            {['Airbnb', 'Booking.com'].map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className="py-5 rounded-2xl border-2 font-bold text-sm transition-all"
                style={platform === p ? { borderColor: PL[p], color: PL[p], background: `${PL[p]}10` } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
                {p}
              </button>
            ))}
          </div>
          <button disabled={!platform} onClick={() => setStep(2)} className="btn-primary w-full gap-2 disabled:opacity-40">
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl p-2 text-xs font-semibold text-center" style={{ background: `${PL[platform]}15`, color: PL[platform] }}>
            Importing from {platform}
          </div>
          <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            style={{ borderColor: file ? 'var(--color-primary)' : '#E5E7EB' }} onClick={() => fileRef.current?.click()}>
            <Upload size={28} className="mx-auto mb-2" style={{ color: file ? 'var(--color-primary)' : '#D1D5DB' }} />
            {file
              ? <><div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{file.name}</div><div className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</div></>
              : <><div className="text-sm font-semibold text-gray-500">Tap to select file</div><div className="text-xs text-gray-400 mt-0.5">CSV or Excel (.xlsx)</div></>}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 gap-1"><ArrowLeft size={15} /> Back</button>
            <button onClick={handlePreview} disabled={!file || loading} className="btn-primary flex-1 gap-1 disabled:opacity-40">
              {loading ? 'Reading...' : <><ArrowRight size={15} /> Continue</>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Found <strong>{preview.totalRows}</strong> bookings across <strong>{preview.listingNames.length}</strong> listing{preview.listingNames.length !== 1 ? 's' : ''}.
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {preview.listingNames.map(name => {
              const isRec = preview.recognized.find(r => r.listingName === name);
              return (
                <div key={name} className="rounded-xl p-3 bg-gray-50">
                  <div className="text-xs font-bold text-gray-700 mb-2 truncate">{name}</div>
                  {isRec
                    ? <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold"><Check size={12} /> Auto-matched to "{isRec.propertyName}"</div>
                    : <select className="input text-sm w-full" value={mapping[name] || ''} onChange={e => setMapping({ ...mapping, [name]: e.target.value })}>
                        <option value="">-- Select your property --</option>
                        {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 gap-1"><ArrowLeft size={15} /> Back</button>
            <button onClick={handleImport} disabled={loading} className="btn-primary flex-1 gap-1 disabled:opacity-40">
              {loading ? 'Importing...' : <><Upload size={15} /> Import</>}
            </button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
            <Check size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-gray-900">Import Complete</div>
            <div className="text-sm text-gray-500 mt-1">{result.imported} booking{result.imported !== 1 ? 's' : ''} imported from {platform}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Imported', value: result.imported, color: '#10B981' }, { label: 'Skipped', value: result.skipped, color: '#F59E0B' }, { label: 'Errors', value: result.errors, color: '#EF4444' }].map(({ label, value, color }) => (
              <div key={label} className="card text-center py-3">
                <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Earnings() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [showAddOverall, setShowAddOverall] = useState(false);

  const { start, end } = getDateRange(range);
  const buildParams = (extra = {}) => {
    const p = new URLSearchParams(extra);
    if (start) p.set('startDate', start);
    if (end)   p.set('endDate', end);
    return p;
  };

  const { data: profitData, isLoading } = useQuery({
    queryKey: ['profit', range],
    queryFn: () => api.get(`/expenses/profit?${buildParams()}`).then(r => r.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });
  const properties = propertiesData?.properties || [];

  const { data: overallExpData } = useQuery({
    queryKey: ['expenses-overall', range],
    queryFn: () => api.get(`/expenses?${buildParams({ type: 'overall' })}`).then(r => r.data),
  });
  const overallExpenses = overallExpData?.expenses || [];

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      queryClient.invalidateQueries({ queryKey: ['expenses-overall'] });
      queryClient.invalidateQueries({ queryKey: ['profit'] });
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/bookings/export?${buildParams()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `hostos-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['profit'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-overall'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
  };

  const {
    totalRevenue = 0, totalExpenses = 0, netProfit = 0,
    propertyStats = [], platformBreakdown = [], insights = {},
  } = profitData || {};

  const isProfitable = netProfit >= 0;
  const [showRangeModal, setShowRangeModal] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Business Overview ── */}
      <div className="card">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Business Overview</h2>
          <div className="flex items-center gap-1.5">
            {/* Filter icon opens the range modal */}
            <button onClick={() => setShowRangeModal(true)}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 bg-white active:scale-95 transition-all">
              <SlidersHorizontal size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">{RANGE_LABELS[range].split(' ').slice(-1)[0] === 'time' ? 'All' : RANGE_LABELS[range].split(' ')[1]}</span>
            </button>
            <button onClick={() => setShowImport(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white active:scale-95 transition-all">
              <Upload size={14} className="text-gray-500" />
            </button>
            <button onClick={handleExport}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white active:scale-95 transition-all"
              style={{ background: 'var(--color-primary)' }}>
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between gap-2 mb-5">
          <h2 className="text-lg font-bold text-gray-900">Business Overview</h2>
          <div className="flex items-center gap-2">
            <RangeDropdown value={range} onChange={setRange} />
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all">
              <Upload size={14} /> Import
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
              style={{ background: 'var(--color-primary)' }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Mobile: Net Profit hero + Revenue/Expenses row */}
        <div className="md:hidden">
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Net Profit</div>
            <div className="text-4xl font-extrabold tracking-tight" style={{ color: isProfitable ? '#10B981' : '#EF4444' }}>
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </div>
            {!isProfitable && netProfit !== 0 && (
              <div className="text-xs text-red-400 font-medium mt-1">Running at a loss</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Revenue</div>
              <div className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Expenses</div>
              <div className="text-xl font-extrabold tracking-tight" style={{ color: totalExpenses > 0 ? '#EF4444' : '#374151' }}>
                ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: 3-column layout */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {[
            { label: 'TOTAL REVENUE',  value: totalRevenue,  color: 'var(--color-primary)' },
            { label: 'TOTAL EXPENSES', value: totalExpenses, color: totalExpenses > 0 ? '#EF4444' : '#374151' },
            { label: 'NET PROFIT',     value: netProfit,     color: isProfitable ? '#10B981' : '#EF4444' },
          ].map(({ label, value, color }, i) => (
            <div key={label} className={`py-2 ${i > 0 ? 'pl-4 border-l border-gray-100' : ''}`}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
              <div className="text-3xl font-extrabold tracking-tight" style={{ color }}>
                ₹{Math.abs(value).toLocaleString('en-IN')}
              </div>
              {label === 'NET PROFIT' && !isProfitable && value !== 0 && (
                <div className="text-xs text-red-400 font-medium mt-1">Running at a loss</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Property Performance ── */}
      {propertyStats.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Performance</h2>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Property', 'Bookings Revenue', 'Expenses', 'Margin', 'Status'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propertyStats.map(p => {
                  const cfg = STATUS_CFG[p.status] || STATUS_CFG['Low Margin'];
                  return (
                    <tr key={p.propertyId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900 text-base">{p.propertyName}</td>
                      <td className="py-4 font-semibold text-base" style={{ color: 'var(--color-primary)' }}>
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 font-semibold text-base" style={{ color: p.totalExpenses > 0 ? '#EF4444' : '#9CA3AF' }}>
                        ₹{p.totalExpenses.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 font-bold text-base" style={{ color: cfg.text }}>{p.margin}%</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: cfg.bg, color: cfg.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {propertyStats.map(p => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG['Low Margin'];
              return (
                <div key={p.propertyId} className="rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-base text-gray-900">{p.propertyName}</div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                      {p.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-center gap-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Revenue</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{p.revenue.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Expenses</div>
                      <div className="text-sm font-bold" style={{ color: p.totalExpenses > 0 ? '#EF4444' : '#9CA3AF' }}>₹{p.totalExpenses.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Margin</div>
                      <div className="text-sm font-bold" style={{ color: cfg.text }}>{p.margin}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Insights ── */}
      {(insights.topPerformer || insights.needsAttention || insights.underperforming) && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                key: 'topPerformer',
                data: insights.topPerformer,
                icon: TrendingUp,
                iconColor: '#10B981',
                iconBg: '#DCFCE7',
                title: 'Top Performer',
                emptyText: 'No data yet.',
              },
              {
                key: 'needsAttention',
                data: insights.needsAttention,
                icon: AlertTriangle,
                iconColor: '#F59E0B',
                iconBg: '#FEF9C3',
                title: 'Needs Attention',
                emptyText: 'All properties are doing well.',
              },
              {
                key: 'underperforming',
                data: insights.underperforming,
                icon: TrendingDown,
                iconColor: '#EF4444',
                iconBg: '#FEE2E2',
                title: 'Underperforming',
                emptyText: 'No underperforming properties.',
              },
            ].map(({ key, data, icon: Icon, iconColor, iconBg, title, emptyText }) => (
              <div key={key} className="card">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}>
                    <Icon size={15} style={{ color: iconColor }} />
                  </div>
                  <span className="text-sm font-bold text-gray-800">{title}</span>
                </div>
                {data ? (
                  <>
                    <div className="text-base font-bold text-gray-900">{data.name}</div>
                    <div className="text-sm text-gray-500 mt-1 leading-relaxed">{data.message}</div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">{emptyText}</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 font-medium mt-3">
            See what's profitable. Fix what's not.
          </p>
        </div>
      )}

      {/* ── Platform Breakdown ── */}
      {platformBreakdown.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue by Platform</h2>
          <div className="space-y-4">
            {platformBreakdown.map(({ platform, total, count }) => {
              const color = PLATFORM_COLORS[platform] || '#6B7280';
              const pct = Math.round((total / (platformBreakdown[0]?.total || 1)) * 100);
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <span className="text-base font-semibold text-gray-700">{platform}</span>
                      <span className="text-sm text-gray-400">{count} booking{count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-base font-bold" style={{ color }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Overall Expenses ── */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Overall Expenses</h2>
            <p className="text-sm text-gray-400 mt-0.5">Shared costs split across properties by revenue</p>
          </div>
          <button onClick={() => setShowAddOverall(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white active:scale-95 transition-all flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}>
            <Plus size={14} /> Add Expense
          </button>
        </div>

        {overallExpenses.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
              <IndianRupee size={20} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-500">No overall expenses yet</p>
            <p className="text-sm text-gray-400 mt-1">E.g. software tools, insurance, marketing</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {overallExpenses.map(exp => {
                const meta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
                const Icon = meta.icon;
                return (
                  <div key={exp._id} className="flex items-center gap-3 py-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}15` }}>
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate">{exp.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                          style={{ background: `${meta.color}15`, color: meta.color }}>{exp.category}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-base font-bold text-red-500">₹{exp.amount.toLocaleString('en-IN')}</span>
                      <button onClick={() => handleDeleteExpense(exp._id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors group">
                        <Trash2 size={14} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">Total</span>
              <span className="text-base font-extrabold text-red-500">
                ₹{overallExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Empty state ── */}
      {!isLoading && totalRevenue === 0 && propertyStats.length === 0 && overallExpenses.length === 0 && (
        <div className="card text-center py-14">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}>
            <IndianRupee size={26} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-lg font-bold text-gray-700">Nothing here yet</p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
            Import your bookings to see revenue, expenses, and profit broken down by property.
          </p>
          <button onClick={() => setShowImport(true)} className="btn-primary mt-5 mx-auto px-6">
            <Upload size={15} /> Import Bookings
          </button>
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} properties={properties} onImported={invalidateAll} />}
      {showRangeModal && <RangeModal value={range} onChange={setRange} onClose={() => setShowRangeModal(false)} />}
      {showAddOverall && (
        <ExpenseModal defaultType="overall" properties={properties}
          onClose={() => setShowAddOverall(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['profit'] });
            queryClient.invalidateQueries({ queryKey: ['expenses-overall'] });
          }}
        />
      )}
    </div>
  );
}
