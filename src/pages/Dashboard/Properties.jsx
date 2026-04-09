import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import {
  Plus, Home, MapPin, Wifi, Copy, Share2, Trash2,
  Edit3, Link2, ChevronRight, Check, X, ExternalLink,
  ClipboardList, CheckSquare, Square, Users2, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { PropertyCardSkeleton } from '../../components/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

// ─── Property Form ────────────────────────────────────────────────────────────
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
        <textarea className="input resize-none" rows={3} placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      ) : (
        <input type={type} className="input" placeholder={placeholder}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
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

// ─── Share Link Modal ─────────────────────────────────────────────────────────
function ShareLinkModal({ property, onClose }) {
  const [copied, setCopied] = useState(false);
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
        <div className="relative">
          <div className="input text-xs text-gray-500 pr-12 overflow-hidden text-ellipsis whitespace-nowrap bg-gray-50">
            {guestUrl}
          </div>
          <button onClick={copy}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
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
        </div>
      </div>
    </Modal>
  );
}

// ─── Co-Host Request Modal ────────────────────────────────────────────────────
function CoHostModal({ onClose, existingRequest }) {
  const [form, setForm] = useState({
    totalProperties: '',
    propertiesNeedingPM: '',
    locations: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRequest);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.totalProperties || !form.propertiesNeedingPM) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cohost', form);
      setSubmitted(true);
      toast.success('Request submitted! Our team will contact you soon.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Get a Co-Host / Property Manager" onClose={onClose} size="md">
      {submitted || existingRequest ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--color-primary-light)' }}>
            <Users2 size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Request Received!</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Our team will review your request and reach out to you within <strong>48 hours</strong> to discuss the best property management solution for your needs.
            </p>
          </div>
          {existingRequest && (
            <div className="rounded-xl p-3 text-left text-xs space-y-1" style={{ background: 'var(--color-primary-light)' }}>
              <div><span className="text-gray-500">Status:</span> <span className="font-bold capitalize" style={{ color: 'var(--color-primary)' }}>{existingRequest.status}</span></div>
              <div><span className="text-gray-500">Properties needing PM:</span> <span className="font-semibold text-gray-800">{existingRequest.propertiesNeedingPM}</span></div>
            </div>
          )}
          <button onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--color-primary-light)' }}>
            <p className="text-sm font-semibold text-gray-700 leading-relaxed">
              Struggling to manage your properties? Let us connect you with a verified co-host or property manager who will handle day-to-day operations, guest communication, and more.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">Total Properties *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 3"
                  value={form.totalProperties}
                  onChange={e => setForm({ ...form, totalProperties: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="label">Need PM for *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 2"
                  value={form.propertiesNeedingPM}
                  onChange={e => setForm({ ...form, propertiesNeedingPM: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label className="label">Property Locations</label>
              <input type="text" className="input" placeholder="e.g. Goa, Mumbai"
                value={form.locations}
                onChange={e => setForm({ ...form, locations: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="label">Additional Notes</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Any specific requirements, property type, preferred start date..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center">
            Someone from our team will contact you within 48 hours.
          </p>
        </div>
      )}
    </Modal>
  );
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property, onEdit, onShare, onDelete, onTodosUpdate }) {
  const queryClient = useQueryClient();
  const [showTodos, setShowTodos] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  const pendingTodos = (property.todos || []).filter(t => !t.done);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    setAddingTodo(true);
    try {
      const { data } = await api.post(`/properties/${property._id}/todos`, { text: newTodo.trim() });
      onTodosUpdate(property._id, data.todos);
      setNewTodo('');
    } catch { toast.error('Failed to add task'); }
    finally { setAddingTodo(false); }
  };

  const toggleTodo = async (todoId, done) => {
    try {
      const { data } = await api.patch(`/properties/${property._id}/todos/${todoId}`, { done: !done });
      onTodosUpdate(property._id, data.todos);
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTodo = async (todoId) => {
    try {
      const { data } = await api.delete(`/properties/${property._id}/todos/${todoId}`);
      onTodosUpdate(property._id, data.todos);
    } catch { toast.error('Failed to delete task'); }
  };

  return (
    <div className="card animate-fade-in-up">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary-light)' }}>
              <Home size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            {/* Red dot badge for pending todos */}
            {pendingTodos.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold" style={{ fontSize: 9 }}>
                  {pendingTodos.length > 9 ? '9+' : pendingTodos.length}
                </span>
              </div>
            )}
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

      {/* WiFi info */}
      {property.wifiName && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 px-3 py-2 rounded-xl bg-gray-50">
          <Wifi size={12} />
          <span className="font-medium">{property.wifiName}</span>
          {property.wifiPassword && (
            <><span className="text-gray-300">·</span><span>{property.wifiPassword}</span></>
          )}
        </div>
      )}

      {/* To-Do section */}
      <div className="mb-3">
        <button
          onClick={() => setShowTodos(!showTodos)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors hover:bg-gray-50"
          style={{ background: pendingTodos.length > 0 ? '#FEF2F2' : 'var(--color-bg)' }}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={14} style={{ color: pendingTodos.length > 0 ? '#EF4444' : 'var(--color-text-muted)' }} />
            <span className="text-xs font-semibold"
              style={{ color: pendingTodos.length > 0 ? '#EF4444' : 'var(--color-text-secondary)' }}>
              {pendingTodos.length > 0
                ? `${pendingTodos.length} task${pendingTodos.length > 1 ? 's' : ''} pending`
                : `Tasks (${(property.todos || []).length})`}
            </span>
          </div>
          {showTodos ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {showTodos && (
          <div className="mt-2 space-y-1.5">
            {(property.todos || []).map(todo => (
              <div key={todo._id} className="flex items-center gap-2 group">
                <button onClick={() => toggleTodo(todo._id, todo.done)}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: todo.done ? 'var(--color-primary)' : '#D1D5DB' }}>
                  {todo.done ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span className={`flex-1 text-xs ${todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo._id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                  <X size={11} />
                </button>
              </div>
            ))}

            {/* Add new todo */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-primary-500 bg-white"
                placeholder="Add a task… (e.g. Fix plumbing)"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
              />
              <button onClick={addTodo} disabled={!newTodo.trim() || addingTodo}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-40"
                style={{ background: 'var(--color-primary)' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Properties() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [shareProperty, setShareProperty] = useState(null);
  const [showCoHostModal, setShowCoHostModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/properties').then(r => r.data),
  });

  const { data: coHostData } = useQuery({
    queryKey: ['cohost-my'],
    queryFn: () => api.get('/cohost/my').then(r => r.data),
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

  // Update todos in local cache without a full refetch
  const handleTodosUpdate = (propertyId, todos) => {
    queryClient.setQueryData(['properties'], (old) => {
      if (!old) return old;
      return {
        ...old,
        properties: old.properties.map(p =>
          p._id === propertyId ? { ...p, todos } : p
        ),
      };
    });
  };

  const existingCoHostRequest = coHostData?.request;

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

      {/* Co-Host CTA Banner */}
      <button
        onClick={() => setShowCoHostModal(true)}
        className="w-full rounded-2xl p-4 flex items-center justify-between gap-3 transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Users2 size={20} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-sm">
              {existingCoHostRequest ? 'Co-Host Request Submitted' : 'Need a Property Manager?'}
            </div>
            <div className="text-white/80 text-xs mt-0.5">
              {existingCoHostRequest
                ? `Status: ${existingCoHostRequest.status} — Our team will contact you soon`
                : 'Get a verified co-host to manage your properties'}
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-white/70 flex-shrink-0" />
      </button>

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
              onTodosUpdate={handleTodosUpdate}
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

      {showCoHostModal && (
        <CoHostModal
          onClose={() => { setShowCoHostModal(false); queryClient.invalidateQueries({ queryKey: ['cohost-my'] }); }}
          existingRequest={existingCoHostRequest}
        />
      )}
    </div>
  );
}
