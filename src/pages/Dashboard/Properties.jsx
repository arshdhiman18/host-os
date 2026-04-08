import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  Plus, Home, MapPin, Wifi, Copy, Share2, Trash2,
  Edit3, Link2, ChevronRight, Check, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';

function PropertyForm({ property, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: property?.name || '',
    location: property?.location || '',
    pricePerNight: property?.pricePerNight || '',
    wifiName: property?.wifiName || '',
    wifiPassword: property?.wifiPassword || '',
    instructions: property?.instructions || '',
    mapUrl: property?.mapUrl || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Property name is required'); return; }
    setLoading(true);
    try {
      if (property) {
        await api.put(`/properties/${property._id}`, form);
        toast.success('Property updated');
      } else {
        await api.post('/properties', form);
        toast.success('Property added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="input-group" key={key}>
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="input resize-none"
          rows={3}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <Modal isOpen title={property ? 'Edit Property' : 'Add Property'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        {field('name', 'Property Name *', 'text', 'My Airbnb Villa')}
        {field('location', 'Location', 'text', 'Goa, India')}
        {field('pricePerNight', 'Price per Night (₹)', 'number', 'Optional')}
        <div className="divider" />
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest Info (shown after check-in)</div>
        {field('wifiName', 'WiFi Name', 'text', 'HomeNetwork_5G')}
        {field('wifiPassword', 'WiFi Password', 'text', '••••••••')}
        {field('instructions', 'Check-in Instructions', 'textarea', 'Key is under the mat...')}
        {field('mapUrl', 'Google Maps URL', 'url', 'https://maps.google.com/...')}
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Saving...' : property ? 'Save Changes' : 'Add Property'}
        </button>
      </form>
    </Modal>
  );
}

function ShareLinkModal({ property, onClose }) {
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState('');
  const guestUrl = `${window.location.origin}/g/${property.guestLinkToken}`;

  const copy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const shareWhatsApp = () => {
    const text = `Hi! Please fill in your check-in details here: ${guestUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal isOpen title="Share Guest Link" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">Guest link for</div>
          <div className="font-bold text-gray-900">{property.name}</div>
        </div>

        {/* Link display */}
        <div className="relative">
          <div className="input text-xs text-gray-500 pr-12 overflow-hidden text-ellipsis whitespace-nowrap bg-gray-50">
            {guestUrl}
          </div>
          <button
            onClick={copy}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={copy} className="btn-secondary py-3 text-sm gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors">
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>

        <a href={guestUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-semibold py-2"
          style={{ color: 'var(--color-primary)' }}>
          <ExternalLink size={14} />
          Preview guest form
        </a>

        <div className="text-xs text-gray-400 text-center leading-relaxed">
          Share this link with guests via WhatsApp, SMS, or any messaging app.
          They fill in their details and upload ID proof from their phone.
        </div>
      </div>
    </Modal>
  );
}

function PropertyCard({ property, onEdit, onShare, onDelete }) {
  return (
    <div className="card animate-fade-in-up">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-primary-light)' }}>
            <Home size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">{property.name}</div>
            {property.location && (
              <div className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                <MapPin size={10} /> {property.location}
              </div>
            )}
            {property.pricePerNight && (
              <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>
                ₹{property.pricePerNight.toLocaleString('en-IN')}/night
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(property)}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <Edit3 size={14} />
          </button>
          <button onClick={() => onDelete(property._id)}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* WiFi info preview */}
      {property.wifiName && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 px-3 py-2 rounded-xl bg-gray-50">
          <Wifi size={12} />
          <span className="font-medium">{property.wifiName}</span>
          {property.wifiPassword && (
            <><span className="text-gray-300">·</span><span>{property.wifiPassword}</span></>
          )}
        </div>
      )}

      {/* Share link CTA */}
      <button
        onClick={() => onShare(property)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
      >
        <span className="flex items-center gap-2">
          <Link2 size={15} />
          Share Guest Link
        </span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function Properties() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [shareProperty, setShareProperty] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property removed');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this property? All bookings remain.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Properties</h2>
          <p className="text-xs text-gray-400">{data?.properties?.length || 0} active</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="btn-primary text-sm px-3 py-2 rounded-xl gap-1.5">
          <Plus size={16} />
          Add Property
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : data?.properties?.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-primary-light)' }}>
            <Home size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Add your first property</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            Create a property to get a unique guest link to share with your guests.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            <Plus size={16} />
            Add Property
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.properties.map(p => (
            <PropertyCard
              key={p._id}
              property={p}
              onEdit={(p) => { setEditProperty(p); setShowForm(true); }}
              onShare={setShareProperty}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PropertyForm
          property={editProperty}
          onClose={() => { setShowForm(false); setEditProperty(null); }}
          onSaved={handleSaved}
        />
      )}

      {shareProperty && (
        <ShareLinkModal
          property={shareProperty}
          onClose={() => setShareProperty(null)}
        />
      )}
    </div>
  );
}
