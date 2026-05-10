import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'hostos_push_state'; // 'granted' | 'dismissed'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function PushPermission() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show if: browser supports push, not already decided, and Notification API available
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') {
      // Already granted — silently subscribe without showing the prompt
      subscribeQuietly();
      return;
    }
    // Show prompt after a short delay so it doesn't pop up immediately on login
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const subscribeQuietly = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await api.get('/notifications/vapid-public-key');
      if (!keyRes.data.key) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.key),
      });
      await api.post('/notifications/push-subscribe', { subscription: sub.toJSON() });
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {}
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        localStorage.setItem(STORAGE_KEY, 'dismissed');
        setVisible(false);
        return;
      }
      const keyRes = await api.get('/notifications/vapid-public-key');
      if (!keyRes.data.key) throw new Error('No VAPID key');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.key),
      });
      await api.post('/notifications/push-subscribe', { subscription: sub.toJSON() });
      localStorage.setItem(STORAGE_KEY, 'granted');
      toast.success('Push notifications enabled!');
      setVisible(false);
    } catch (err) {
      toast.error('Could not enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3"
      style={{ animation: 'notifSlideUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-primary-light)' }}
      >
        <Bell size={18} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">Enable push notifications</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          Get instant alerts when a guest checks in or the team sends you a message.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAllow}
            disabled={loading}
            className="btn-primary py-1.5 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? 'Enabling…' : 'Allow'}
          </button>
          <button
            onClick={handleDismiss}
            className="py-1.5 px-4 text-xs font-semibold rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-100 flex-shrink-0"
      >
        <X size={13} />
      </button>
      <style>{`
        @keyframes notifSlideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
