import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  IndianRupee, Download, Upload,
  ArrowRight, ArrowLeft, Check, Trash2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExpenseModal, { CATEGORY_META } from '../../components/ExpenseModal';

const PLATFORM_COLORS = {
  Airbnb: '#FF5A5F',
  'Booking.com': '#0071C2',
  Direct: '#509B8D',
  Other: '#6B7280',
  Manual: '#8B5CF6',
};

const STATUS_STYLE = {
  Profitable:  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'Low Margin': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Loss-Making': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
};

function getDateRange(range) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (range === '3m') return { start: fmt(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())), end: today };
  if (range === '6m') return { start: fmt(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())), end: today };
  if (range === 'year') return { start: `${now.getFullYear()}-01-01`, end: today };
  return { start: '', end: '' };
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported, properties }) {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
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
      const m = {};
      data.recognized.forEach(r => { m[r.listingName] = r.propertyId; });
      setMapping(m);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const allListings = preview?.listingNames || [];
    const unmapped = allListings.filter(n => !mapping[n]);
    if (unmapped.length > 0) return toast.error(`Map all listings before importing (${unmapped.length} unmapped)`);
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

  const PL = { Airbnb: '#FF5A5F', 'Booking.com': '#0071C2' };

  return (
    <Modal isOpen title="Import Bookings" onClose={onClose} size="md">
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
                  style={done ? { background: '#10B981', color: 'white' } : active ? { background: 'var(--color-primary)', color: 'white' } : { background: '#F3F4F6', color: '#9CA3AF' }}
                >
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
                style={platform === p ? { borderColor: PL[p], color: PL[p], background: `${PL[p]}10` } : { borderColor: '#E5E7EB', color: '#6B7280' }}
              >{p}</button>
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
          <p className="text-sm text-gray-500">Upload the CSV/Excel file you downloaded from {platform}'s earnings or reservations section.</p>
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
              const isRecognized = preview.recognized.find(r => r.listingName === name);
              return (
                <div key={name} className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
                  <div className="text-xs font-bold text-gray-700 mb-2 truncate">{name}</div>
                  {isRecognized ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                      <Check size={12} /> Auto-matched to "{isRecognized.propertyName}"
                    </div>
                  ) : (
                    <select className="input text-sm w-full" value={mapping[name] || ''} onChange={e => setMapping({ ...mapping, [name]: e.target.value })}>
                      <option value="">-- Select your property --</option>
                      {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-400">New mappings are saved — future imports auto-match these listings.</div>
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
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Earnings / Profit Dashboard ────────────────────────────────────────
export default function Earnings() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [showAddOverall, setShowAddOverall] = useState(false);

  const { start, end } = getDateRange(range);

  const profitParams = new URLSearchParams();
  if (start) profitParams.set('startDate', start);
  if (end) profitParams.set('endDate', end);

  const { data: profitData, isLoading } = useQuery({
    queryKey: ['profit', range],
    queryFn: () => api.get(`/expenses/profit?${profitParams}`).then(r => r.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });
  const properties = propertiesData?.properties || [];

  const overallExpParams = new URLSearchParams({ type: 'overall' });
  if (start) overallExpParams.set('startDate', start);
  if (end) overallExpParams.set('endDate', end);

  const { data: overallExpData } = useQuery({
    queryKey: ['expenses-overall', range],
    queryFn: () => api.get(`/expenses?${overallExpParams}`).then(r => r.data),
  });
  const overallExpenses = overallExpData?.expenses || [];

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      queryClient.invalidateQueries({ queryKey: ['expenses-overall'] });
      queryClient.invalidateQueries({ queryKey: ['profit'] });
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      const response = await api.get(`/bookings/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostos-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['profit'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-overall'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
  };

  const { totalRevenue = 0, totalExpenses = 0, netProfit = 0, propertyStats = [], platformBreakdown = [], insights = {} } = profitData || {};

  const RANGES = [
    { value: '3m', label: 'Last 3M' },
    { value: '6m', label: 'Last 6M' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Profit Dashboard</h2>
          <p className="text-xs text-gray-400">Business overview across all properties</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5">
            <Upload size={15} /> Import
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm px-3 py-2 rounded-xl gap-1.5">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Date range selector */}
      <div className="flex gap-2">
        {RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
            style={range === r.value
              ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
              : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Business Overview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Revenue', value: totalRevenue, color: 'var(--color-primary)' },
          { label: 'Expenses', value: totalExpenses, color: '#EF4444' },
          { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? '#10B981' : '#EF4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
            <div className="text-base font-extrabold leading-tight" style={{ color }}>
              ₹{Math.abs(value).toLocaleString('en-IN')}
            </div>
            {label === 'Net Profit' && value < 0 && (
              <div className="text-xs text-red-400 font-semibold mt-0.5">Loss</div>
            )}
          </div>
        ))}
      </div>

      {/* Property Performance table */}
      {propertyStats.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-3">Property Performance</h3>
          <div className="space-y-2">
            {propertyStats.map(p => {
              const st = STATUS_STYLE[p.status] || STATUS_STYLE['Low Margin'];
              return (
                <div key={p.propertyId} className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-gray-900 truncate flex-1 mr-2">{p.propertyName}</div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 flex items-center gap-1"
                      style={{ background: st.bg, color: st.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                      {p.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-400">Revenue</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Expenses</div>
                      <div className="text-sm font-bold text-red-500">
                        ₹{p.totalExpenses.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Margin</div>
                      <div className="text-sm font-bold" style={{ color: st.text }}>
                        {p.margin}%
                      </div>
                    </div>
                  </div>
                  {/* Margin bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(p.margin, 0), 100)}%`, background: st.dot }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      {(insights.topPerformer || insights.needsAttention || insights.underperforming) && (
        <div className="card">
          <h3 className="section-title mb-3">Insights</h3>
          <div className="space-y-2">
            {insights.topPerformer && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#D1FAE5' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#10B981' }}>
                  <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-green-800">Top Performer</div>
                  <div className="text-sm font-semibold text-green-900">{insights.topPerformer.name}</div>
                  <div className="text-xs text-green-700 mt-0.5">{insights.topPerformer.message}</div>
                </div>
              </div>
            )}
            {insights.needsAttention && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FEF3C7' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F59E0B' }}>
                  <AlertTriangle size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800">Needs Attention</div>
                  <div className="text-sm font-semibold text-amber-900">{insights.needsAttention.name}</div>
                  <div className="text-xs text-amber-700 mt-0.5">{insights.needsAttention.message}</div>
                </div>
              </div>
            )}
            {insights.underperforming && (
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FEE2E2' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EF4444' }}>
                  <TrendingDown size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-800">Underperforming</div>
                  <div className="text-sm font-semibold text-red-900">{insights.underperforming.name}</div>
                  <div className="text-xs text-red-700 mt-0.5">{insights.underperforming.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-3">Revenue by Platform</h3>
          <div className="space-y-2.5">
            {platformBreakdown.map(({ platform, total, count }) => {
              const maxTotal = platformBreakdown[0]?.total || 1;
              const barWidth = Math.round((total / maxTotal) * 100);
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[platform] || '#6B7280' }} />
                      <span className="text-sm font-semibold text-gray-700">{platform}</span>
                      <span className="text-xs text-gray-400">{count} booking{count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: PLATFORM_COLORS[platform] || '#374151' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, background: PLATFORM_COLORS[platform] || '#6B7280' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Overall Expenses</h3>
          <button
            onClick={() => setShowAddOverall(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        {overallExpenses.length === 0 ? (
          <div className="text-center py-6">
            <IndianRupee size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400">No overall expenses yet</p>
            <p className="text-xs text-gray-300 mt-0.5">These are split across all properties by revenue</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overallExpenses.map(exp => {
              const meta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
              const Icon = meta.icon;
              return (
                <div key={exp._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}15` }}>
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{exp.description}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: `${meta.color}15`, color: meta.color }}>{exp.category}</span>
                      <span>{new Date(exp.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-sm font-bold text-red-500">₹{exp.amount.toLocaleString('en-IN')}</div>
                    <button onClick={() => handleDeleteExpense(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Total</span>
              <span className="text-red-500">₹{overallExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty state when no data at all */}
      {!isLoading && totalRevenue === 0 && propertyStats.length === 0 && (
        <div className="card text-center py-10">
          <IndianRupee size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No data yet</p>
          <p className="text-xs text-gray-300 mt-1">Import bookings or add expenses to see your profit dashboard</p>
        </div>
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          properties={properties}
          onImported={invalidateAll}
        />
      )}

      {showAddOverall && (
        <ExpenseModal
          defaultType="overall"
          properties={properties}
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
