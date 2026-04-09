import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, Home, IndianRupee, TrendingUp, Search, LogOut, Shield,
  CheckCircle, Clock, XCircle, ThumbsUp, ThumbsDown, FileText,
  LayoutDashboard, UserCheck, Users2, MapPin, CreditCard, Eye, EyeOff,
  Check, X, AlertCircle, RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/SkeletonLoader';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColors = {
  active: 'badge-success',
  trial: 'badge-warning',
  expired: 'badge-danger',
};
const statusIcons = {
  active: <CheckCircle size={12} />,
  trial: <Clock size={12} />,
  expired: <XCircle size={12} />,
};
const verifyColors = {
  unverified: 'badge-gray',
  pending: 'badge-warning',
  verified: 'badge-success',
  rejected: 'badge-danger',
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'hosts', label: 'Hosts', icon: Users },
  { id: 'verifications', label: 'Verify', icon: UserCheck },
  { id: 'cohost', label: 'Co-Host', icon: Users2 },
  { id: 'demographics', label: 'Map', icon: MapPin },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, statsLoading }) {
  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topCards = [
    { icon: Users, label: 'Total Hosts', value: stats?.totalHosts || 0, color: 'var(--color-primary)' },
    { icon: Home, label: 'Properties', value: stats?.totalProperties || 0, color: 'var(--color-primary-dark)' },
    { icon: TrendingUp, label: 'Bookings', value: stats?.totalBookings || 0, color: 'var(--color-accent)' },
    { icon: UserCheck, label: 'Verified Hosts', value: stats?.verifiedHosts || 0, color: '#10B981' },
  ];

  return (
    <div className="space-y-5">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color }} />
              <span className="text-xs font-medium text-gray-400">{label}</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Subscription / Admin earnings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-base font-bold text-gray-900">Subscription Revenue</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center py-4 rounded-2xl" style={{ background: 'var(--color-primary-light)' }}>
            <div className="text-2xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
              {stats?.activeSubscriptions || 0}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">Active</div>
          </div>
          <div className="text-center py-4 rounded-2xl bg-amber-50">
            <div className="text-2xl font-extrabold text-amber-600">{stats?.trialUsers || 0}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Trial</div>
          </div>
          <div className="text-center py-4 rounded-2xl bg-red-50">
            <div className="text-2xl font-extrabold text-red-500">{stats?.expiredUsers || 0}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Expired</div>
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          <div className="text-white/70 text-xs font-semibold mb-1">Est. Monthly Revenue</div>
          <div className="text-white text-3xl font-extrabold">
            ₹{(stats?.estimatedMonthlyRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-white/60 text-xs mt-1">
            {stats?.monthlySubscribers || 0} monthly · {stats?.yearlySubscribers || 0} yearly plans
          </div>
        </div>
      </div>

      {/* Host earnings (all platforms) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee size={16} style={{ color: '#10B981' }} />
          <h2 className="text-base font-bold text-gray-900">Host Earnings (Platform Total)</h2>
        </div>
        <div className="text-2xl font-extrabold text-green-600">
          ₹{(stats?.hostEarnings || 0).toLocaleString('en-IN')}
        </div>
        <p className="text-xs text-gray-400 mt-1">Total earnings recorded across all hosts</p>
      </div>

      {/* Alerts */}
      {(stats?.pendingVerifications > 0 || stats?.pendingCoHostRequests > 0) && (
        <div className="card space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Action Required</div>
          {stats?.pendingVerifications > 0 && (
            <div className="flex items-center gap-3 py-2 border-b border-gray-50">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <UserCheck size={14} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? 's' : ''} pending</div>
                <div className="text-xs text-gray-400">Review host ID documents</div>
              </div>
            </div>
          )}
          {stats?.pendingCoHostRequests > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-primary-light)' }}>
                <Users2 size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{stats.pendingCoHostRequests} co-host request{stats.pendingCoHostRequests > 1 ? 's' : ''} pending</div>
                <div className="text-xs text-gray-400">Contact hosts needing a property manager</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hosts Tab ────────────────────────────────────────────────────────────────
function HostsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: hostsData, isLoading } = useQuery({
    queryKey: ['admin-hosts', search, page],
    queryFn: () => api.get(`/admin/hosts?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then(r => r.data),
  });

  const ratingMutation = useMutation({
    mutationFn: ({ id, rating }) => api.patch(`/admin/hosts/${id}/rating`, { rating }),
    onMutate: async ({ id, rating }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-hosts', search, page] });
      const previous = queryClient.getQueryData(['admin-hosts', search, page]);
      queryClient.setQueryData(['admin-hosts', search, page], (old) => {
        if (!old) return old;
        return { ...old, hosts: old.hosts.map(h => h._id === id ? { ...h, hostRating: rating } : h) };
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['admin-hosts', search, page], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-hosts'] }),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 text-sm" placeholder="Search by name or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Host', 'Phone', 'Status', 'Verified', 'Properties', 'Bookings', 'Rating', 'Joined'].map(h => (
                    <th key={h} className="text-left pb-2 text-xs font-semibold text-gray-400 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hostsData?.hosts?.map(host => (
                  <tr key={host._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'var(--color-primary)' }}>
                          {host.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{host.name}</div>
                          <div className="text-xs text-gray-400">{host.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{host.phone || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`${statusColors[host.subscriptionStatus]} flex items-center gap-1 w-fit`}>
                        {statusIcons[host.subscriptionStatus]}
                        {host.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`${verifyColors[host.verificationStatus || 'unverified']} text-xs px-2 py-0.5 rounded-full`}>
                        {host.verificationStatus || 'unverified'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-center">{host.propertyCount}</td>
                    <td className="py-3 pr-4 font-semibold text-center">{host.bookingCount}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => ratingMutation.mutate({ id: host._id, rating: host.hostRating === 'good' ? null : 'good' })}
                          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${host.hostRating === 'good' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-green-600'}`}>
                          <ThumbsUp size={10} />
                        </button>
                        <button
                          onClick={() => ratingMutation.mutate({ id: host._id, rating: host.hostRating === 'bad' ? null : 'bad' })}
                          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${host.hostRating === 'bad' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}>
                          <ThumbsDown size={10} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {format(new Date(host.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-3">
            {hostsData?.hosts?.map(host => (
              <div key={host._id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}>
                    {host.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{host.name}</div>
                    <div className="text-xs text-gray-400 truncate">{host.email}</div>
                    {host.phone && <div className="text-xs text-gray-400">{host.phone}</div>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`${statusColors[host.subscriptionStatus]} flex items-center gap-1`}>
                        {statusIcons[host.subscriptionStatus]}
                        {host.subscriptionStatus}
                      </span>
                      <span className={`${verifyColors[host.verificationStatus || 'unverified']} text-xs`}>
                        {host.verificationStatus || 'unverified'}
                      </span>
                      <span className="text-xs text-gray-400">{host.propertyCount}P · {host.bookingCount}B</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => ratingMutation.mutate({ id: host._id, rating: host.hostRating === 'good' ? null : 'good' })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${host.hostRating === 'good' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <ThumbsUp size={13} />
                    </button>
                    <button
                      onClick={() => ratingMutation.mutate({ id: host._id, rating: host.hostRating === 'bad' ? null : 'bad' })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${host.hostRating === 'bad' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <ThumbsDown size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hostsData?.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Prev
              </button>
              <span className="text-sm text-gray-500">{page} / {hostsData.pages}</span>
              <button disabled={page === hostsData.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Verifications Tab ────────────────────────────────────────────────────────
function VerificationsTab() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => api.get('/admin/verifications').then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, note }) => api.patch(`/admin/hosts/${id}/verify`, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setExpanded(null);
      setNote('');
      toast.success('Verification updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  if (!data?.hosts?.length) {
    return (
      <div className="card text-center py-12">
        <CheckCircle size={40} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm font-semibold text-gray-400">No pending verifications</p>
        <p className="text-xs text-gray-300 mt-1">All host IDs have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500">{data.total} pending review</div>
      {data.hosts.map(host => (
        <div key={host._id} className="card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}>
              {host.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">{host.name}</div>
              <div className="text-xs text-gray-400">{host.email} · {host.phone || '—'}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Joined {format(new Date(host.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
            <button onClick={() => setExpanded(expanded === host._id ? null : host._id)}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              {expanded === host._id ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
          </div>

          {expanded === host._id && (
            <div className="mt-4 space-y-3">
              {/* ID documents */}
              {host.verificationIdUrls?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Submitted Documents</div>
                  <div className="flex flex-wrap gap-2">
                    {host.verificationIdUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        <FileText size={13} /> Document {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="input-group">
                <label className="label text-xs">Note (shown to host on rejection)</label>
                <textarea className="input resize-none text-sm" rows={2} placeholder="e.g. Please upload clearer photos"
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => verifyMutation.mutate({ id: host._id, status: 'verified', note })}
                  disabled={verifyMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors">
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  onClick={() => verifyMutation.mutate({ id: host._id, status: 'rejected', note })}
                  disabled={verifyMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Co-Host Requests Tab ─────────────────────────────────────────────────────
function CoHostTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cohost', statusFilter],
    queryFn: () => api.get(`/admin/cohost-requests${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/cohost-requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cohost'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const statusBadge = { pending: 'badge-warning', contacted: 'badge-primary', closed: 'badge-gray' };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'contacted', l: 'Contacted' }, { v: 'closed', l: 'Closed' }].map(({ v, l }) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === v ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'}`}
            style={statusFilter === v ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : !data?.requests?.length ? (
        <div className="card text-center py-12">
          <Users2 size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No co-host requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.requests.map(req => (
            <div key={req._id} className="card">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{req.hostName}</div>
                  <div className="text-xs text-gray-400">{req.hostEmail} · {req.hostPhone || '—'}</div>
                </div>
                <span className={`${statusBadge[req.status]} capitalize flex-shrink-0`}>{req.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl p-3 bg-gray-50">
                  <div className="text-xs text-gray-400">Total Properties</div>
                  <div className="text-lg font-bold text-gray-900">{req.totalProperties}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
                  <div className="text-xs text-gray-400">Needs PM for</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{req.propertiesNeedingPM}</div>
                </div>
              </div>
              {req.locations && (
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin size={11} /> {req.locations}
                </div>
              )}
              {req.message && (
                <div className="text-xs text-gray-500 italic mb-3 bg-gray-50 rounded-xl p-2">"{req.message}"</div>
              )}
              <div className="text-xs text-gray-400 mb-3">{format(new Date(req.createdAt), 'MMM d, yyyy')}</div>
              <div className="flex gap-2">
                {req.status === 'pending' && (
                  <button onClick={() => statusMutation.mutate({ id: req._id, status: 'contacted' })}
                    disabled={statusMutation.isPending}
                    className="flex-1 py-2 rounded-xl font-semibold text-xs text-white transition-colors"
                    style={{ background: 'var(--color-primary)' }}>
                    Mark Contacted
                  </button>
                )}
                {req.status !== 'closed' && (
                  <button onClick={() => statusMutation.mutate({ id: req._id, status: 'closed' })}
                    disabled={statusMutation.isPending}
                    className="flex-1 py-2 rounded-xl font-semibold text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Demographics Tab ─────────────────────────────────────────────────────────
function DemographicsTab() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-demographics'],
    queryFn: () => api.get('/admin/demographics').then(r => r.data),
  });

  // Geocode locations using Nominatim (free, no key required)
  const geocodeLocations = async (locations) => {
    setGeocoding(true);
    const results = [];
    for (const { location, count } of locations.slice(0, 20)) { // limit to 20 to avoid rate limits
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const json = await res.json();
        if (json[0]) {
          results.push({ location, count, lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
        }
        await new Promise(r => setTimeout(r, 200)); // rate limit: 1 req/200ms
      } catch { /* skip */ }
    }
    setMarkers(results);
    setGeocoding(false);
  };

  // Lazy-load Leaflet
  useEffect(() => {
    if (!data?.locations?.length || mapLoaded) return;

    const loadLeaflet = async () => {
      if (window.L) { setMapLoaded(true); return; }
      // Inject leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      // Inject leaflet JS
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      setMapLoaded(true);
    };

    loadLeaflet();
  }, [data, mapLoaded]);

  // Init map after leaflet loads
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletMapRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([20, 78], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    leafletMapRef.current = map;

    // Start geocoding
    if (data?.locations?.length) {
      geocodeLocations(data.locations);
    }
  }, [mapLoaded]);

  // Add markers when geocoded
  useEffect(() => {
    if (!leafletMapRef.current || !markers.length) return;
    const L = window.L;

    markers.forEach(({ location, count, lat, lng }) => {
      const size = Math.min(10 + count * 4, 36);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(80,155,141,0.85);border:2px solid #2F5D56;display:flex;align-items:center;justify-content:center;color:white;font-size:${size > 20 ? 10 : 8}px;font-weight:bold;">${count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([lat, lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(`<strong>${location}</strong><br>${count} propert${count > 1 ? 'ies' : 'y'}`);
    });
  }, [markers]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {data?.total || 0} properties across {data?.locations?.length || 0} locations
        {geocoding && <span className="ml-2 text-xs text-amber-600">Geocoding locations…</span>}
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden rounded-2xl">
        <div ref={mapRef} style={{ height: 350, width: '100%', borderRadius: '1.25rem' }}>
          {!mapLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <RefreshCw size={24} className="mx-auto mb-2 text-gray-300 animate-spin" />
                <p className="text-xs text-gray-400">Loading map…</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <div className="card">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Top Locations</div>
          <div className="space-y-2">
            {(data?.locations || []).slice(0, 15).map(({ location, count }, i) => (
              <div key={location} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary)', fontSize: 9 }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{location}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 rounded-full" style={{
                    width: Math.max(20, (count / ((data?.locations[0]?.count || 1))) * 80) + 'px',
                    background: 'var(--color-primary)',
                    opacity: 0.7,
                  }} />
                  <span className="text-xs font-bold text-gray-500">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 md:px-6"
        style={{ height: 'var(--header-height)' }}>
        <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">HostOS Admin</div>
              <div className="text-xs text-gray-400 hidden md:block">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Dashboard
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="sticky top-[var(--header-height)] z-40 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              const badge =
                id === 'verifications' ? stats?.pendingVerifications :
                id === 'cohost' ? stats?.pendingCoHostRequests : 0;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors flex-shrink-0 relative ${
                    isActive ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                  style={isActive ? { borderColor: 'var(--color-primary)' } : {}}>
                  <Icon size={14} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                      style={{ fontSize: 9 }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-10 animate-fade-in">
        {activeTab === 'overview' && <OverviewTab stats={stats} statsLoading={statsLoading} />}
        {activeTab === 'hosts' && <HostsTab />}
        {activeTab === 'verifications' && <VerificationsTab />}
        {activeTab === 'cohost' && <CoHostTab />}
        {activeTab === 'demographics' && <DemographicsTab />}
      </div>
    </div>
  );
}
