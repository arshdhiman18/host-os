import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check, ArrowRight, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const perks = ['15-day free trial', 'No credit card required', 'Cancel anytime'];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error('All fields are required');
      return;
    }
    if (!form.phone.startsWith('+')) {
      toast.error('Please include country code, e.g. +91 98765 43210');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.phone, form.password);
      toast.success('Account created! Your 15-day trial starts now 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <div className="px-4 py-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-gray-900">HostOS</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start your free 15-day trial today</p>
          </div>

          {/* Perks */}
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {perks.map((p) => (
              <span key={p} className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--color-primary-dark)' }}>
                <Check size={12} style={{ color: 'var(--color-primary)' }} />
                {p}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="input-group">
              <label className="label">
                Phone <span className="text-xs text-gray-400 font-normal">(with country code)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  className="input pl-9"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Include your country code (e.g. +91 for India, +1 for USA)</p>
            </div>

            <div className="input-group">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-4 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>Start Free Trial <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            By signing up, you agree to our terms. Your data is secure and private.
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
