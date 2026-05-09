import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function OtpVerify({ email, onSuccess, onBack }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (code) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp: code });
      onSuccess(data.token, data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code. Try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 0);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d)) verify(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      verify(text);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New code sent!');
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  const code = digits.join('');

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <Mail size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
            style={{
              borderColor: d ? 'var(--color-primary)' : '#E5E7EB',
              background: d ? 'var(--color-primary-light)' : 'white',
              color: 'var(--color-primary-dark)',
            }}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={loading || code.length < 6}
        onClick={() => verify(code)}
        className="btn-primary w-full text-base py-4 mb-4"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying…
          </span>
        ) : (
          <span className="flex items-center gap-2 justify-center">
            Verify Email <ArrowRight size={18} />
          </span>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Didn't receive the code?{' '}
        {cooldown > 0 ? (
          <span className="font-semibold text-gray-400">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto mt-5"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      )}
    </div>
  );
}
