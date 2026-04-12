import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check, ArrowRight, ChevronDown, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'IN', dial: '+91',  name: 'India',          flag: '🇮🇳' },
  { code: 'AE', dial: '+971', name: 'UAE',             flag: '🇦🇪' },
  { code: 'AU', dial: '+61',  name: 'Australia',       flag: '🇦🇺' },
  { code: 'BD', dial: '+880', name: 'Bangladesh',      flag: '🇧🇩' },
  { code: 'BR', dial: '+55',  name: 'Brazil',          flag: '🇧🇷' },
  { code: 'CA', dial: '+1',   name: 'Canada',          flag: '🇨🇦' },
  { code: 'CN', dial: '+86',  name: 'China',           flag: '🇨🇳' },
  { code: 'DE', dial: '+49',  name: 'Germany',         flag: '🇩🇪' },
  { code: 'EG', dial: '+20',  name: 'Egypt',           flag: '🇪🇬' },
  { code: 'ES', dial: '+34',  name: 'Spain',           flag: '🇪🇸' },
  { code: 'FR', dial: '+33',  name: 'France',          flag: '🇫🇷' },
  { code: 'GB', dial: '+44',  name: 'United Kingdom',  flag: '🇬🇧' },
  { code: 'GH', dial: '+233', name: 'Ghana',           flag: '🇬🇭' },
  { code: 'HK', dial: '+852', name: 'Hong Kong',       flag: '🇭🇰' },
  { code: 'ID', dial: '+62',  name: 'Indonesia',       flag: '🇮🇩' },
  { code: 'IT', dial: '+39',  name: 'Italy',           flag: '🇮🇹' },
  { code: 'JP', dial: '+81',  name: 'Japan',           flag: '🇯🇵' },
  { code: 'KE', dial: '+254', name: 'Kenya',           flag: '🇰🇪' },
  { code: 'KR', dial: '+82',  name: 'South Korea',     flag: '🇰🇷' },
  { code: 'LK', dial: '+94',  name: 'Sri Lanka',       flag: '🇱🇰' },
  { code: 'MX', dial: '+52',  name: 'Mexico',          flag: '🇲🇽' },
  { code: 'MY', dial: '+60',  name: 'Malaysia',        flag: '🇲🇾' },
  { code: 'NG', dial: '+234', name: 'Nigeria',         flag: '🇳🇬' },
  { code: 'NL', dial: '+31',  name: 'Netherlands',     flag: '🇳🇱' },
  { code: 'NP', dial: '+977', name: 'Nepal',           flag: '🇳🇵' },
  { code: 'NZ', dial: '+64',  name: 'New Zealand',     flag: '🇳🇿' },
  { code: 'PH', dial: '+63',  name: 'Philippines',     flag: '🇵🇭' },
  { code: 'PK', dial: '+92',  name: 'Pakistan',        flag: '🇵🇰' },
  { code: 'PT', dial: '+351', name: 'Portugal',        flag: '🇵🇹' },
  { code: 'QA', dial: '+974', name: 'Qatar',           flag: '🇶🇦' },
  { code: 'RU', dial: '+7',   name: 'Russia',          flag: '🇷🇺' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia',    flag: '🇸🇦' },
  { code: 'SE', dial: '+46',  name: 'Sweden',          flag: '🇸🇪' },
  { code: 'SG', dial: '+65',  name: 'Singapore',       flag: '🇸🇬' },
  { code: 'TH', dial: '+66',  name: 'Thailand',        flag: '🇹🇭' },
  { code: 'TR', dial: '+90',  name: 'Turkey',          flag: '🇹🇷' },
  { code: 'TZ', dial: '+255', name: 'Tanzania',        flag: '🇹🇿' },
  { code: 'UA', dial: '+380', name: 'Ukraine',         flag: '🇺🇦' },
  { code: 'US', dial: '+1',   name: 'United States',   flag: '🇺🇸' },
  { code: 'VN', dial: '+84',  name: 'Vietnam',         flag: '🇻🇳' },
  { code: 'ZA', dial: '+27',  name: 'South Africa',    flag: '🇿🇦' },
  { code: 'ZW', dial: '+263', name: 'Zimbabwe',        flag: '🇿🇼' },
];

const perks = ['15-day free trial', 'No credit card required', 'Cancel anytime'];

function CountryPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
      )
    : COUNTRIES;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-full px-3 border-r border-gray-200 rounded-l-xl bg-gray-50 hover:bg-gray-100 transition-colors min-w-[80px]"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-sm font-semibold text-gray-700">{selected.dial}</span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-card-lg border border-gray-100 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 rounded-xl outline-none border border-gray-100 focus:border-gray-300"
                placeholder="Search country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${selected.code === c.code ? 'bg-gray-50' : ''}`}
              >
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                <span className="text-xs font-semibold text-gray-400">{c.dial}</span>
                {selected.code === c.code && <Check size={13} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !phoneNumber || !form.password) {
      toast.error('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const fullPhone = `${country.dial}${phoneNumber.replace(/^0+/, '')}`;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name,
        email: form.email,
        phone: fullPhone,
        password: form.password,
      });
      localStorage.setItem('hostos_token', data.token);
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start your free 15-day trial today</p>
          </div>

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
              <input type="text" className="input" placeholder="Rahul Sharma"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                autoComplete="name" />
            </div>

            <div className="input-group">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email" inputMode="email" />
            </div>

            <div className="input-group">
              <label className="label">Phone</label>
              <div className="flex rounded-xl border border-gray-200 overflow-visible focus-within:border-primary-500 bg-white transition-all">
                <CountryPicker selected={country} onSelect={setCountry} />
                <input
                  type="tel"
                  className="flex-1 px-3 py-3 text-sm font-medium outline-none bg-transparent rounded-r-xl"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                  autoComplete="tel-national"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-12"
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : <>Start Free Trial <ArrowRight size={18} /></>}
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
