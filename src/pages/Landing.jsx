import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Users, IndianRupee, FileCheck, Star, ArrowRight,
  Check, ChevronRight, Shield, Zap, BarChart3
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Guest Onboarding', desc: 'Share a link. Guest fills the form. Done.' },
  { icon: FileCheck, title: 'ID Verification', desc: 'Guests upload ID proofs securely via their phone.' },
  { icon: IndianRupee, title: 'Earnings Tracking', desc: 'Track every rupee across all properties.' },
  { icon: Home, title: 'Multi-Property', desc: 'Manage Airbnb, Booking.com, and direct guests.' },
  { icon: BarChart3, title: 'Reports & Export', desc: 'Download Excel reports with one tap.' },
  { icon: Shield, title: 'Secure & Private', desc: 'All data encrypted. Your guests are protected.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Airbnb Superhost, Goa', text: 'HostOS completely changed how I manage guests. The shareable link is a game changer.', rating: 5 },
  { name: 'Rahul Mehta', role: '4 properties, Mumbai', text: 'Finally a tool built for Indian hosts. Tracking earnings has never been this easy.', rating: 5 },
  { name: 'Anjali Nair', role: 'Booking.com host, Kerala', text: 'The mobile experience is flawless. I manage everything from my phone.', rating: 5 },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-gray-900 text-base">HostOS</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-600 px-3 py-2 hover:text-gray-900 transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')}
              className="btn-primary text-sm px-4 py-2 rounded-xl">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-14 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
          <Zap size={12} />
          15-day free trial • No credit card required
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          The easiest way to manage<br />
          <span style={{ color: 'var(--color-primary)' }}>your property guests</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Share a link. Guest fills their details. You track earnings and ID proofs—all from your phone.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <button onClick={() => navigate('/signup')}
            className="btn-primary text-base px-8 py-4 rounded-2xl shadow-card-lg">
            Start Free Trial
            <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate('/login')}
            className="btn-secondary text-base px-8 py-4 rounded-2xl">
            Sign In
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <span className="font-bold text-gray-700">500+</span> hosts
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            <span className="font-bold text-gray-700">10,000+</span> guests onboarded
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1 text-amber-500">
            ★★★★★ <span className="text-gray-400">rated</span>
          </span>
        </div>
      </section>

      {/* App preview strip */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="rounded-3xl overflow-hidden shadow-card-lg border border-gray-100"
          style={{ background: 'var(--color-primary-light)' }}>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Earnings', value: '₹1,24,500', color: 'var(--color-primary)' },
                { label: 'This Month', value: '₹28,000', color: 'var(--color-primary-dark)' },
                { label: 'Total Bookings', value: '47', color: 'var(--color-accent)' },
                { label: 'Pending', value: '₹4,500', color: '#EF4444' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-card">
                  <div className="text-xs font-medium text-gray-400 mb-1">{stat.label}</div>
                  <div className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
            Everything a host needs
          </h2>
          <p className="text-gray-500">Built specifically for Airbnb and Booking.com hosts in India</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-md hover:shadow-card-lg transition-shadow duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'var(--color-primary-light)' }}>
                <Icon size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--color-primary-light)' }} className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">How it works</h2>
            <p className="text-gray-500">Three steps to manage your guests perfectly</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Add your property', desc: 'Set up your property in 2 minutes. Add name, location, WiFi, and check-in instructions.' },
              { step: '2', title: 'Share the guest link', desc: 'Each property gets a unique link. Share via WhatsApp or QR code when guests arrive.' },
              { step: '3', title: 'Track everything', desc: 'Guests fill details and upload ID. You see all bookings, earnings, and reports in one place.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-4"
                  style={{ background: 'var(--color-primary)' }}>
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-10">Loved by hosts</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.name} className="card-md">
              <div className="flex text-amber-400 mb-3 text-sm">
                {'★'.repeat(t.rating)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <div className="text-sm font-bold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Simple pricing</h2>
          <p className="text-gray-500">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Free trial */}
          <div className="card-md">
            <div className="font-bold text-gray-900 mb-1">Free Trial</div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">₹0</div>
            <div className="text-sm text-gray-400 mb-5">15 days</div>
            {['All features included', 'No credit card', 'Full access'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Check size={14} className="text-green-500 flex-shrink-0" /> {f}
              </div>
            ))}
          </div>

          {/* Monthly */}
          <div className="card-md border-2" style={{ borderColor: 'var(--color-primary)' }}>
            <div className="font-bold mb-1" style={{ color: 'var(--color-primary)' }}>Monthly</div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">₹500</div>
            <div className="text-sm text-gray-400 mb-5">per month</div>
            {['Unlimited bookings', 'All features', 'Email support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Check size={14} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }} /> {f}
              </div>
            ))}
            <button onClick={() => navigate('/signup')}
              className="btn-primary w-full mt-4 text-sm py-2.5">
              Get Started
            </button>
          </div>

          {/* Yearly */}
          <div className="card-md relative overflow-hidden">
            <div className="absolute top-3 right-3 badge-warning text-xs">Save 50%</div>
            <div className="font-bold text-gray-900 mb-1">Yearly</div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">₹3,000</div>
            <div className="text-sm text-gray-400 mb-5">per year (₹250/mo)</div>
            {['Everything in Monthly', 'Priority support', 'Early features'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Check size={14} className="text-amber-500 flex-shrink-0" /> {f}
              </div>
            ))}
            <button onClick={() => navigate('/signup')}
              className="btn-accent w-full mt-4 text-sm py-2.5">
              Best Value
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto rounded-3xl p-8 md:p-12 text-center text-white"
          style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))` }}>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Start managing your guests today
          </h2>
          <p className="text-sm opacity-80 mb-8 leading-relaxed">
            Join 500+ hosts who use HostOS daily. Free 15-day trial, no credit card required.
          </p>
          <button onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-base hover:opacity-90 transition-opacity"
            style={{ color: 'var(--color-primary)' }}>
            Start Free Trial
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="font-bold text-gray-700">HostOS</span>
        </div>
        <p className="text-xs text-gray-400">© 2024 HostOS. Built for property hosts.</p>
      </footer>
    </div>
  );
}
