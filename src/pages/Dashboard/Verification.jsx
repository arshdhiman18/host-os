import React, { useState, useRef } from 'react';
import api from '../../utils/api';
import { ShieldCheck, Upload, FileText, X, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Verification({ onVerified }) {
  const { user, refreshUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const verificationStatus = user?.verificationStatus || 'unverified';

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!files.length) { toast.error('Please select at least one ID document'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('idProofs', f));
      await api.post('/verification/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Documents submitted! Verification typically takes 24 hours.');
      if (refreshUser) await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Pending state
  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--color-primary-light)' }}>
            <Clock size={36} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Verification Pending</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Your ID documents are under review. We'll verify your account within <strong>24 hours</strong>.
              You'll be notified once approved.
            </p>
          </div>
          <div className="card text-left space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-xs text-gray-600">Documents received</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
              <span className="text-xs text-gray-600">Admin review in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0" />
              <span className="text-xs text-gray-400">Dashboard access granted</span>
            </div>
          </div>
          <button
            onClick={async () => { if (refreshUser) await refreshUser(); }}
            className="btn-secondary text-sm gap-2 mx-auto">
            <RefreshCw size={14} />
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  // Rejected state
  if (verificationStatus === 'rejected') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle size={36} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Verification Rejected</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Your verification was not approved. Please re-submit clear photos of your government-issued ID.
            </p>
            {user?.verificationNote && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-sm text-red-700 text-left">
                <strong>Reason:</strong> {user.verificationNote}
              </div>
            )}
          </div>
          {/* Re-upload form */}
          <ReUploadForm />
        </div>
      </div>
    );
  }

  // Unverified — upload form
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-primary-light)' }}>
            <ShieldCheck size={36} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Verify Your Identity</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            To ensure a safe experience for everyone, we need to verify your identity before you can access the dashboard.
          </p>
        </div>

        {/* What to upload */}
        <div className="card space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Accepted Documents</div>
          {['Aadhaar Card (front & back)', 'Passport', "Driver's License", 'PAN Card'].map(doc => (
            <div key={doc} className="flex items-center gap-2">
              <CheckCircle size={13} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
              <span className="text-xs text-gray-600">{doc}</span>
            </div>
          ))}
        </div>

        {/* Upload area */}
        <div>
          <input ref={inputRef} type="file" multiple accept="image/*,application/pdf"
            className="hidden" onChange={handleFiles} />

          {files.length === 0 ? (
            <button onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors">
              <Upload size={24} style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-semibold text-gray-700">Tap to upload documents</span>
              <span className="text-xs text-gray-400">JPG, PNG or PDF · Max 10MB each</span>
            </button>
          ) : (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white">
                  <FileText size={16} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium text-gray-700 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => inputRef.current?.click()}
                className="w-full py-2 text-xs font-semibold rounded-xl border border-dashed border-gray-200"
                style={{ color: 'var(--color-primary)' }}>
                + Add more documents
              </button>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading || !files.length}
          className="btn-primary w-full text-base py-4">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </span>
          ) : 'Submit for Verification'}
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Your documents are securely stored and only used for identity verification. We typically verify within 24 hours.
        </p>
      </div>
    </div>
  );
}

// Reusable re-upload for rejected state
function ReUploadForm() {
  const { refreshUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (!files.length) { toast.error('Please select documents'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('idProofs', f));
      await api.post('/verification/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documents re-submitted!');
      if (refreshUser) await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
        onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} />
      <button onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-semibold"
        style={{ color: 'var(--color-primary)' }}>
        <Upload size={16} /> {files.length ? `${files.length} file(s) selected` : 'Select Documents'}
      </button>
      <button onClick={handleSubmit} disabled={loading || !files.length} className="btn-primary w-full">
        {loading ? 'Uploading...' : 'Re-submit Documents'}
      </button>
    </div>
  );
}
