import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  ChevronLeft, ChevronRight, CalendarDays,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
} from 'date-fns';
import Modal from '../../components/Modal';

const PROPERTY_COLORS = [
  '#509B8D', '#F59E0B', '#6366F1', '#EC4899',
  '#10B981', '#F97316', '#8B5CF6', '#14B8A6',
];

function getPropertyColor(index) {
  return PROPERTY_COLORS[index % PROPERTY_COLORS.length];
}

const PLATFORM_COLORS = {
  Airbnb: '#FF5A5F',
  'Booking.com': '#0071C2',
  Direct: '#509B8D',
  Other: '#8B5CF6',
  Manual: '#6B7280',
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });
  const properties = propertiesData?.properties || [];

  const propertyColorMap = useMemo(() => {
    const map = {};
    properties.forEach((p, i) => { map[p._id] = getPropertyColor(i); });
    return map;
  }, [properties]);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['calendar-bookings', format(currentDate, 'yyyy-MM'), selectedPropertyId],
    queryFn: () => {
      const params = new URLSearchParams({
        checkInStart: format(monthStart, 'yyyy-MM-dd'),
        checkInEnd: format(monthEnd, 'yyyy-MM-dd'),
        limit: '500',
      });
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId);
      return api.get(`/bookings?${params}`).then(r => r.data);
    },
  });

  const bookings = bookingsData?.bookings || [];

  // Calendar grid: Monday start
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    calendarDays.push(d);
    d = addDays(d, 1);
  }

  function getBookingsForDay(date) {
    return bookings.filter(b => {
      if (!b.checkIn) return isSameDay(new Date(b.createdAt), date);
      const checkIn = new Date(b.checkIn);
      const checkOut = b.checkOut ? new Date(b.checkOut) : checkIn;
      return date >= checkIn && date < checkOut;
    });
  }

  const today = new Date();

  // Month summary stats
  const totalBooked = bookings.length;
  const confirmedAmount = bookings
    .filter(b => b.earningsStatus === 'confirmed')
    .reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400">Bookings across your properties</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-gray-900 w-28 text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center py-3">
          <div className="text-xs text-gray-400 font-medium">Bookings this month</div>
          <div className="text-2xl font-extrabold mt-0.5" style={{ color: 'var(--color-primary)' }}>
            {totalBooked}
          </div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xs text-gray-400 font-medium">Confirmed earnings</div>
          <div className="text-lg font-extrabold mt-0.5" style={{ color: 'var(--color-primary-dark)' }}>
            ₹{confirmedAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Property filter */}
      {properties.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPropertyId('')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
            style={!selectedPropertyId
              ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
              : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
            }
          >
            All
          </button>
          {properties.map((p, i) => (
            <button
              key={p._id}
              onClick={() => setSelectedPropertyId(selectedPropertyId === p._id ? '' : p._id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5"
              style={selectedPropertyId === p._id
                ? { background: getPropertyColor(i), color: 'white', borderColor: getPropertyColor(i) }
                : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
              }
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getPropertyColor(i) }} />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="card p-0 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayBookings = getBookingsForDay(day);
            const inMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={idx}
                className="border-b border-r border-gray-50 p-1"
                style={{
                  minHeight: '68px',
                  opacity: inMonth ? 1 : 0.3,
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined,
                }}
              >
                <div
                  className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 mx-auto"
                  style={isToday
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : { color: '#374151' }
                  }
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 2).map(b => {
                    const propIdx = properties.findIndex(
                      p => p._id === (b.propertyId?._id || b.propertyId)
                    );
                    const color = selectedPropertyId
                      ? 'var(--color-primary)'
                      : getPropertyColor(propIdx >= 0 ? propIdx : 0);
                    return (
                      <button
                        key={b._id + day.toString()}
                        onClick={() => setSelectedBooking(b)}
                        className="w-full text-left px-1 rounded text-white leading-tight active:scale-95 transition-transform truncate"
                        style={{ background: color, fontSize: '9px', paddingTop: '2px', paddingBottom: '2px' }}
                        title={b.guestName}
                      >
                        {b.guestName}
                      </button>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <div className="text-gray-400 font-semibold px-0.5" style={{ fontSize: '9px' }}>
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {properties.length > 1 && !selectedPropertyId && (
        <div className="flex flex-wrap gap-3">
          {properties.map((p, i) => (
            <div key={p._id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: getPropertyColor(i) }} />
              <span className="text-xs text-gray-500 font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && bookings.length === 0 && (
        <div className="card text-center py-10">
          <CalendarDays size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No bookings in {format(currentDate, 'MMMM yyyy')}</p>
          <p className="text-xs text-gray-300 mt-1">Bookings with check-in dates appear here</p>
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <Modal isOpen title="Booking Details" onClose={() => setSelectedBooking(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'var(--color-primary)' }}
              >
                {selectedBooking.guestName[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-gray-900">{selectedBooking.guestName}</div>
                <div className="text-xs text-gray-400">{selectedBooking.guestPhone || 'No phone'}</div>
              </div>
              {/* Platform badge */}
              <span
                className="ml-auto text-xs font-bold px-2 py-1 rounded-lg text-white flex-shrink-0"
                style={{ background: PLATFORM_COLORS[selectedBooking.platform] || '#6B7280' }}
              >
                {selectedBooking.platform}
              </span>
            </div>

            <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'var(--color-primary-light)' }}>
              {[
                { label: 'Property', value: selectedBooking.propertyId?.name || '—' },
                {
                  label: 'Check-in',
                  value: selectedBooking.checkIn
                    ? format(new Date(selectedBooking.checkIn), 'dd MMM yyyy')
                    : '—',
                },
                {
                  label: 'Check-out',
                  value: selectedBooking.checkOut
                    ? format(new Date(selectedBooking.checkOut), 'dd MMM yyyy')
                    : '—',
                },
                { label: 'Guests', value: selectedBooking.numberOfGuests || 1 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span
                className="text-lg font-extrabold"
                style={{ color: selectedBooking.amount ? 'var(--color-primary)' : 'var(--color-accent)' }}
              >
                {selectedBooking.amount
                  ? `₹${selectedBooking.amount.toLocaleString('en-IN')}`
                  : 'Pending'}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
