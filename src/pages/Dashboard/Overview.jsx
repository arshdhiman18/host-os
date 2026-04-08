import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { IndianRupee, Users, TrendingUp, Clock, ArrowUpRight, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--color-primary)', bg = 'var(--color-primary-light)' }) => (
  <div className="card animate-fade-in-up">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-extrabold truncate" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2"
        style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-card-md text-xs">
        <div className="font-semibold text-gray-600 mb-1">{label}</div>
        <div className="font-bold" style={{ color: 'var(--color-primary)' }}>
          ₹{payload[0]?.value?.toLocaleString('en-IN')}
        </div>
        <div className="text-gray-400">{payload[1]?.value} bookings</div>
      </div>
    );
  }
  return null;
};

export default function Overview({ onTabChange }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: () => api.get('/bookings/stats').then(r => r.data),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: () => api.get('/bookings?limit=5').then(r => r.data),
  });

  if (isLoading) return <DashboardSkeleton />;

  const platformColors = {
    'Airbnb': '#FF5A5F',
    'Booking.com': '#003580',
    'Direct': 'var(--color-primary)',
    'Other': '#9CA3AF',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={IndianRupee}
          label="Total Earnings"
          value={`₹${(stats?.totalEarnings || 0).toLocaleString('en-IN')}`}
          sub={`${stats?.totalBookings || 0} bookings total`}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={`₹${(stats?.monthlyEarnings || 0).toLocaleString('en-IN')}`}
          sub={`${stats?.monthlyBookings || 0} bookings`}
          color="var(--color-primary-dark)"
          bg="#e8f5f2"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={`₹${(stats?.pendingEarnings || 0).toLocaleString('en-IN')}`}
          sub={`${stats?.pendingCount || 0} need amount`}
          color="#EF4444"
          bg="#fef2f2"
        />
        <StatCard
          icon={Users}
          label="Avg / Booking"
          value={`₹${(stats?.avgPerBooking || 0).toLocaleString('en-IN')}`}
          sub="average earnings"
          color="var(--color-accent)"
          bg="#fffbeb"
        />
      </div>

      {/* Earnings chart */}
      {stats?.monthlyBreakdown?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Earnings (6 months)</h2>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={stats.monthlyBreakdown} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
                {stats.monthlyBreakdown.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === stats.monthlyBreakdown.length - 1 ? 'var(--color-primary)' : 'var(--color-primary-light)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pending earnings alert */}
      {stats?.pendingCount > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer active:scale-95 transition-transform"
          style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
          onClick={() => onTabChange('earnings')}
        >
          <div>
            <div className="text-sm font-bold text-amber-800">
              ⚠️ {stats.pendingCount} booking{stats.pendingCount > 1 ? 's' : ''} missing amount
            </div>
            <div className="text-xs text-amber-600 mt-0.5">
              Tap to add amounts → earn ₹{stats.pendingEarnings > 0 ? stats.pendingEarnings.toLocaleString('en-IN') : '—'} confirmed
            </div>
          </div>
          <ArrowUpRight size={18} className="text-amber-600 flex-shrink-0" />
        </div>
      )}

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recent Guests</h2>
          <button
            onClick={() => onTabChange('guests')}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: 'var(--color-primary)' }}>
            See all <ArrowUpRight size={12} />
          </button>
        </div>

        {bookingsData?.bookings?.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">No guests yet</p>
            <button
              onClick={() => onTabChange('properties')}
              className="text-sm font-semibold mt-2"
              style={{ color: 'var(--color-primary)' }}>
              Add a property to get started
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookingsData?.bookings?.map((b) => (
              <div key={b._id} className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: platformColors[b.platform] || 'var(--color-primary)' }}>
                  {b.guestName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{b.guestName}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>{b.platform}</span>
                    <span>·</span>
                    <span>{b.propertyId?.name || '—'}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {b.amount ? (
                    <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      ₹{b.amount.toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <span className="badge-warning text-xs">No amount</span>
                  )}
                  <div className="text-xs text-gray-400">
                    {format(new Date(b.createdAt), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
