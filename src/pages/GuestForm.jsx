import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import {
  User, Phone, Users, FileText, Upload, X,
  CheckCircle, Wifi, MapPin, Home, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = ['Direct', 'Airbnb', 'Booking.com', 'Other'];

function SuccessScreen({ property }) {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--color-primary-light)' }}>
      <div className="animate-fade-in-up w-full max-w-sm">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-primary)' }}>
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check-in Complete!</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Your details have been submitted. Here's what you need for your stay.
        </p>

        {property && (
          <div className="bg-white rounded-3xl p-6 shadow-card-lg text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-light)' }}>
                <Home size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="font-extrabold text-gray-900">{property.name}</div>
                {property.location && (
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {property.location}
                  </div>
                )}
              </div>
            </div>

            {(property.wifiName || property.wifiPassword) && (
              <div className="rounded-xl p-3" style={{ background: 'var(--color-primary-light)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Wifi size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--color-primary)' }}>WiFi</span>
                </div>
                {property.wifiName && (
                  <div className="text-sm font-semibold text-gray-800">{property.wifiName}</div>
                )}
                {property.wifiPassword && (
                  <div className="text-sm text-gray-600 font-mono mt-0.5">{property.wifiPassword}</div>
                )}
              </div>
            )}

            {property.instructions && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Check-in Instructions
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.instructions}
                </p>
              </div>
            )}

            {property.mapUrl && (
              <a
                href={property.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-sm"
              >
                <MapPin size={15} />
                Open in Maps
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Have a wonderful stay! 🏡
        </p>
      </div>
    </div>
  );
}

export default function GuestForm() {
  const { token } = useParams();
  const fileRef = useRef();
  const [submitted, setSubmitted] = useState(false);
  const [submittedProperty, setSubmittedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    guestName: '', guestPhone: '', numberOfGuests: 1,
    purpose: '', platform: 'Direct', numberOfDays: 1,
    checkIn: '', checkOut: '',
  });

  const { data: propertyData, isLoading, isError } = useQuery({
    queryKey: ['guest-property', token],
    queryFn: () => api.get(`/guest/${token}`).then(r => r.data),
    retry: false,
  });

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const total = files.length + newFiles.length;
    if (total > 5) { toast.error('Maximum 5 files allowed'); return; }
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guestName.trim()) { toast.error('Please enter your name'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      files.forEach(f => formData.append('idProofs', f));

      const { data } = await api.post(`/guest/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmittedProperty(data.property);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SuccessScreen property={submittedProperty} />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-primary-light)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--color-primary-light)' }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link not found</h2>
          <p className="text-sm text-gray-500">
            This check-in link may be invalid or expired. Please ask your host for a new link.
          </p>
        </div>
      </div>
    );
  }

  const property = propertyData?.property;

  return (
    <div className="min-h-screen min-h-dvh" style={{ background: 'var(--color-primary-light)' }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--color-primary)' }}>
          <Home size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">{property?.name}</h1>
        {property?.location && (
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
            <MapPin size={13} /> {property.location}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">Please fill in your details to check in</p>
      </div>

      {/* Form */}
      <div className="px-4 pb-10">
        <div className="bg-white rounded-3xl shadow-card-lg p-5 max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="input-group">
              <label className="label">
                <User size={13} className="inline mr-1" />
                Full Name *
              </label>
              <input
                className="input"
                placeholder="Your full name"
                value={form.guestName}
                onChange={e => setForm({...form, guestName: e.target.value})}
                autoComplete="name"
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <label className="label">
                <Phone size={13} className="inline mr-1" />
                Phone Number
              </label>
              <input
                className="input"
                placeholder="+91 98765 43210"
                inputMode="tel"
                type="tel"
                value={form.guestPhone}
                onChange={e => setForm({...form, guestPhone: e.target.value})}
                autoComplete="tel"
              />
            </div>

            {/* Number of guests + days */}
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">
                  <Users size={13} className="inline mr-1" />
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="input"
                  inputMode="numeric"
                  value={form.numberOfGuests}
                  onChange={e => setForm({...form, numberOfGuests: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="label">Days Staying</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  inputMode="numeric"
                  value={form.numberOfDays}
                  onChange={e => setForm({...form, numberOfDays: e.target.value})}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">Check In</label>
                <input type="date" className="input" value={form.checkIn}
                  onChange={e => setForm({...form, checkIn: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="label">Check Out</label>
                <input type="date" className="input" value={form.checkOut}
                  onChange={e => setForm({...form, checkOut: e.target.value})} />
              </div>
            </div>

            {/* Platform */}
            <div className="input-group">
              <label className="label">Booking Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({...form, platform: p})}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left"
                    style={form.platform === p
                      ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                      : { borderColor: '#E5E7EB', color: '#6B7280' }
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="input-group">
              <label className="label">Purpose of Visit</label>
              <input
                className="input"
                placeholder="Vacation, business, family..."
                value={form.purpose}
                onChange={e => setForm({...form, purpose: e.target.value})}
              />
            </div>

            {/* ID Upload */}
            <div className="input-group">
              <label className="label">
                <FileText size={13} className="inline mr-1" />
                ID Proof <span className="text-gray-400 font-normal">(optional, up to 5)</span>
              </label>

              {files.length > 0 && (
                <div className="space-y-2 mb-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-gray-300 transition-colors"
                style={files.length > 0 ? {} : {}}
              >
                <Upload size={20} className="text-gray-300" />
                <span className="text-xs font-medium text-gray-400">
                  {files.length === 0 ? 'Upload Aadhaar, Passport, or Driving License' : 'Add more files'}
                </span>
                <span className="text-xs text-gray-300">JPG, PNG, or PDF • Max 10MB each</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-4 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Complete Check-in'}
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              Your information is shared only with the property host and kept private.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
