import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, Home, IndianRupee, TrendingUp, Search,
  LogOut, Shield, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../components/SkeletonLoader';

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

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const { data: hostsData, isLoading: hostsLoading } = useQuery({
    queryKey: ['admin-hosts', search, page],
    queryFn: () => api.get(`/admin/hosts?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then(r => r.data),
  });

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 md:px-6"
        style={{ height: 'var(--header-height)' }}>
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">HostOS Admin</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Page title */}
        <div className="flex items-center gap-2">
          <Shield size={20} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-xl font-extrabold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="card space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))
          ) : [
            { icon: Users, label: 'Total Hosts', value: stats?.totalHosts || 0, color: 'var(--color-primary)' },
            { icon: Home, label: 'Properties', value: stats?.totalProperties || 0, color: 'var(--color-primary-dark)' },
            { icon: TrendingUp, label: 'Bookings', value: stats?.totalBookings || 0, color: 'var(--color-accent)' },
            { icon: IndianRupee, label: 'Total Earnings', value: `₹${(stats?.totalEarnings || 0).toLocaleString('en-IN')}`, color: '#10B981' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-medium text-gray-400">{label}</span>
              </div>
              <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Subscription stats */}
        {stats && (
          <div className="card">
            <h2 className="section-title mb-3">Subscription Status</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center py-3 rounded-xl" style={{ background: 'var(--color-primary-light)' }}>
                <div className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                  {stats.activeSubscriptions}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Active</div>
              </div>
              <div className="text-center py-3 rounded-xl bg-amber-50">
                <div className="text-xl font-extrabold text-amber-600">{stats.trialUsers}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Trial</div>
              </div>
              <div className="text-center py-3 rounded-xl bg-red-50">
                <div className="text-xl font-extrabold text-red-500">{stats.expiredUsers}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">Expired</div>
              </div>
            </div>
          </div>
        )}

        {/* Hosts table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">All Hosts</h2>
            <span className="text-xs text-gray-400 font-medium">{hostsData?.total || 0} total</span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {hostsLoading ? (
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
                      {['Host', 'Email', 'Phone', 'Status', 'Properties', 'Bookings', 'Joined'].map(h => (
                        <th key={h} className="text-left pb-2 text-xs font-semibold text-gray-400">{h}</th>
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
                            <span className="font-semibold text-gray-900">{host.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">{host.email}</td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">{host.phone || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`${statusColors[host.subscriptionStatus]} flex items-center gap-1 w-fit`}>
                            {statusIcons[host.subscriptionStatus]}
                            {host.subscriptionStatus}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-center">{host.propertyCount}</td>
                        <td className="py-3 pr-4 font-semibold text-center">{host.bookingCount}</td>
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
                  <div key={host._id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: 'var(--color-primary)' }}>
                      {host.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{host.name}</div>
                      <div className="text-xs text-gray-400 truncate">{host.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`${statusColors[host.subscriptionStatus]} flex items-center gap-1`}>
                          {statusIcons[host.subscriptionStatus]}
                          {host.subscriptionStatus}
                        </span>
                        <span className="text-xs text-gray-400">
                          {host.propertyCount} props · {host.bookingCount} bookings
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {hostsData?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Prev
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {hostsData.pages}
                  </span>
                  <button disabled={page === hostsData.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
