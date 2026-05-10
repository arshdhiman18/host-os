import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import OtpVerify from '../components/OtpVerify';
import api from '../utils/api';

// ─── Forgot Password ──────────────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent — check your inbox');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) { toast.error('Fill in all fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset! Please sign in.');
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to sign in
        </button>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Forgot password?</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset code</p>
        </div>
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="input-group">
            <label className="label">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              inputMode="email"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 mt-2">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : 'Send Reset Code'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <button onClick={() => setStep('email')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Change email
      </button>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Enter reset code</h1>
        <p className="text-sm text-gray-500 mt-1">
          We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>
      <form onSubmit={handleReset} className="space-y-4">
        <div className="input-group">
          <label className="label">Reset Code</label>
          <input
            type="text"
            className="input tracking-widest text-center text-lg font-bold"
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>
        <div className="input-group">
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className="input pr-12"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="input-group">
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            className="input"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 mt-2">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Resetting...
            </span>
          ) : 'Reset Password'}
        </button>
        <button type="button" onClick={handleSendCode}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
          Didn't receive a code? <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Resend</span>
        </button>
      </form>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [showForgot, setShowForgot] = useState(false);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.pending) {
        setPendingEmail(err.response.data.email);
        toast('Check your email for a verification code.', { icon: '📧' });
        return;
      }
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (token, user) => {
    loginWithToken(token, user);
    navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const pageContent = (() => {
    if (pendingEmail) {
      return (
        <OtpVerify
          email={pendingEmail}
          onSuccess={handleVerified}
          onBack={() => setPendingEmail(null)}
        />
      );
    }

    if (showForgot) {
      return <ForgotPassword onBack={() => setShowForgot(false)} />;
    }

    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your HostOS account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1">
              <label className="label !mb-0">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs font-semibold transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-12"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
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

          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 mt-2">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                Sign In <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            Start free trial
          </Link>
        </p>
      </div>
    );
  })();

  return (
    <div className="min-h-screen min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
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
        {pageContent}
      </div>
    </div>
  );
}
