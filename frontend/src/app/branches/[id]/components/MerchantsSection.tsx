'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, QrCode, Smartphone, IndianRupee, Pencil, X, Image } from 'lucide-react';
import { Merchant } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MerchantsSectionProps {
  accountId: string;
  readOnly?: boolean;
}

const MERCHANT_TYPES = ['PhonePe', 'Google Pay', 'Paytm', 'Amazon Pay', 'CRED', 'Freecharge', 'MobiKwik', 'Other'];

const MERCHANT_COLORS: Record<string, string> = {
  'PhonePe': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Google Pay': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Paytm': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Amazon Pay': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'CRED': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Freecharge': 'bg-green-500/15 text-green-400 border-green-500/30',
  'MobiKwik': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Other': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function MerchantsSection({ accountId, readOnly }: MerchantsSectionProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editBalanceId, setEditBalanceId] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // Add form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('PhonePe');
  const [formMerchantId, setFormMerchantId] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formBalance, setFormBalance] = useState('');
  const [formQrFile, setFormQrFile] = useState<File | null>(null);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchMerchants = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/merchants/account/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMerchants(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [accountId]);

  const handleAdd = async () => {
    const token = getToken();
    if (!token || !formName.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('type', formType);
      formData.append('bankAccountId', accountId);
      if (formMerchantId.trim()) formData.append('merchantId', formMerchantId.trim());
      if (formMobile.trim()) formData.append('mobileNumber', formMobile.trim());
      if (formBalance) formData.append('balance', formBalance);
      if (formQrFile) formData.append('qrCodePhoto', formQrFile);

      const res = await fetch(`${API}/api/merchants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setShowAddForm(false);
        resetForm();
        await fetchMerchants();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async (merchantId: string) => {
    const token = getToken();
    if (!token) return;
    const balance = parseFloat(editBalanceValue);
    if (isNaN(balance)) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/merchants/${merchantId}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ balance }),
      });
      if (res.ok) {
        setEditBalanceId(null);
        setEditBalanceValue('');
        await fetchMerchants();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (merchantId: string) => {
    const token = getToken();
    if (!token) return;
    setDeleting(merchantId);
    try {
      const res = await fetch(`${API}/api/merchants/${merchantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchMerchants();
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('PhonePe');
    setFormMerchantId('');
    setFormMobile('');
    setFormBalance('');
    setFormQrFile(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-pink-400" />
          <h4 className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Linked Merchants</h4>
          <span className="text-xs text-slate-500">({merchants.length})</span>
        </div>
        {!readOnly && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 transition-colors text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            Add Merchant
          </button>
        )}
      </div>

      {/* Add Merchant Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-white">Add Merchant</h5>
            <button onClick={() => { setShowAddForm(false); resetForm(); }} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Type *</label>
              <select
                value={formType}
                onChange={(e) => { setFormType(e.target.value); if (!formName) setFormName(e.target.value); }}
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm"
              >
                {MERCHANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. My PhonePe"
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Merchant ID</label>
              <input
                type="text"
                value={formMerchantId}
                onChange={(e) => setFormMerchantId(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Mobile Number</label>
              <input
                type="text"
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Balance (₹)</label>
              <input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                placeholder="0"
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">QR Code Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormQrFile(e.target.files?.[0] || null)}
                className="w-full mt-1 text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={saving || !formName.trim()}
              className="px-3 py-1.5 rounded bg-pink-600 text-white text-xs font-medium hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Merchant'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="px-3 py-1.5 rounded text-slate-400 text-xs hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Merchants List */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="text-center py-4 bg-slate-800/40 rounded-xl">
          <Smartphone className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">No merchants linked yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {merchants.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
              {/* Merchant icon / QR */}
              <div className="flex-shrink-0">
                {m.qrCodePhoto ? (
                  <button
                    onClick={() => setQrPreview(`${API}${m.qrCodePhoto}`)}
                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-600 hover:border-pink-400 transition-colors"
                    title="View QR Code"
                  >
                    <img src={`${API}${m.qrCodePhoto}`} alt="QR" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Merchant info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{m.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${MERCHANT_COLORS[m.type] || MERCHANT_COLORS['Other']}`}>
                    {m.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  {m.merchantId && <span>ID: {m.merchantId}</span>}
                  {m.mobileNumber && <span>📱 {m.mobileNumber}</span>}
                </div>
              </div>

              {/* Balance */}
              <div className="flex-shrink-0 text-right">
                {editBalanceId === m.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editBalanceValue}
                      onChange={(e) => setEditBalanceValue(e.target.value)}
                      className="w-24 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateBalance(m.id); if (e.key === 'Escape') setEditBalanceId(null); }}
                    />
                    <button
                      onClick={() => handleUpdateBalance(m.id)}
                      disabled={saving}
                      className="px-1.5 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditBalanceId(null)}
                      className="px-1.5 py-1 rounded text-slate-400 text-xs hover:text-white"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-green-400">
                      ₹{Number(m.balance).toLocaleString('en-IN')}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => { setEditBalanceId(m.id); setEditBalanceValue(String(Number(m.balance))); }}
                        className="p-0.5 text-slate-500 hover:text-blue-400 transition-colors"
                        title="Update balance"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Delete */}
              {!readOnly && (
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  className="flex-shrink-0 p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete merchant"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QR Code Preview Modal */}
      {qrPreview && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setQrPreview(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setQrPreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={qrPreview} alt="QR Code" className="w-full rounded-xl border border-slate-700 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
