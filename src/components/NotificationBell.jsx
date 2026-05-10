import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCheck, Star, User, Megaphone, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const TYPE_CONFIG = {
  welcome: {
    Icon: Star,
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    label: 'Welcome',
  },
  guest_submission: {
    Icon: User,
    iconColor: '#3B82F6',
    iconBg: '#EFF6FF',
    label: 'Guest',
  },
  admin_message: {
    Icon: Megaphone,
    iconColor: 'var(--color-primary)',
    iconBg: 'var(--color-primary-light)',
    label: 'Team',
  },
};

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch {}
  }, []);

  // Poll every 30 seconds for unread badge
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Load full list when drawer opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications');
        if (!cancelled) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleItemClick = (notif) => {
    if (!notif.read) markOneRead(notif._id);
    if (notif.type === 'guest_submission' && onNavigate) {
      onNavigate('guests');
      setOpen(false);
    }
  };

  return (
    <>
      {/* Bell icon button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
      >
        <Bell size={19} className="text-gray-600" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white flex items-center justify-center font-bold leading-none px-1"
            style={{ background: '#EF4444', fontSize: 10 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />

          {/* Slide-in drawer */}
          <div
            className="fixed top-0 right-0 h-full w-full md:max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            style={{ animation: 'notifSlideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)' }}
                  >
                    <CheckCheck size={13} />
                    All read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-5 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                        <div className="h-3 bg-gray-100 rounded-full w-full" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--color-primary-light)' }}>
                    <BellOff size={28} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">All caught up</p>
                  <p className="text-xs text-gray-400 mt-1">New notifications will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.admin_message;
                    const { Icon } = cfg;
                    return (
                      <button
                        key={notif._id}
                        onClick={() => handleItemClick(notif)}
                        className="w-full text-left flex gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
                        style={!notif.read ? { background: '#F0FDF9' } : {}}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: cfg.iconBg }}
                        >
                          <Icon size={17} style={{ color: cfg.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm text-gray-900 leading-tight ${!notif.read ? 'font-bold' : 'font-semibold'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                style={{ background: 'var(--color-primary)' }} />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-xs text-gray-300 mt-1.5 font-medium">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-300 text-center">HostOS · Notifications</p>
            </div>
          </div>

          <style>{`
            @keyframes notifSlideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
