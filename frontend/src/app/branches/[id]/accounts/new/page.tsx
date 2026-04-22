'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  User,
  Phone,
  Landmark,
  CreditCard,
  Globe,
  IndianRupee,
  Upload,
  FileCheck,
  Shield,
  Plus,
  Trash2,
  QrCode,
  Smartphone,
  FileText,
  Camera,
} from 'lucide-react';
import Link from 'next/link';

interface MerchantEntry {
  name: string;
  type: string;
  merchantId: string;
  mobileNumber: string;
  balance: string;
  qrFile: File | null;
  qrPreview: string | null;
}

const MERCHANT_TYPES = ['PhonePe', 'Google Pay', 'Paytm', 'Amazon Pay', 'CRED', 'Freecharge', 'MobiKwik', 'Other'];

export default function NewBankAccountPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branchName, setBranchName] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    aadharLinkedNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    bankBranch: '',
    aadharNumber: '',
    panCardNumber: '',
    debitCardNumber: '',
    debitCardExpiry: '',
    debitCardCvv: '',
    netbankingUsername: '',
    netbankingPassword: '',
    bankBalance: '',
  });

  // Document photo states
  const [aadharFront, setAadharFront] = useState<File | null>(null);
  const [aadharBack, setAadharBack] = useState<File | null>(null);
  const [panFront, setPanFront] = useState<File | null>(null);
  const [panBack, setPanBack] = useState<File | null>(null);
  const [debitCardPhoto, setDebitCardPhoto] = useState<File | null>(null);
  const [debitCardPhotoBack, setDebitCardPhotoBack] = useState<File | null>(null);
  const [otherDocuments, setOtherDocuments] = useState<File[]>([]);

  // Previews
  const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(null);
  const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(null);
  const [panFrontPreview, setPanFrontPreview] = useState<string | null>(null);
  const [panBackPreview, setPanBackPreview] = useState<string | null>(null);
  const [debitCardPhotoPreview, setDebitCardPhotoPreview] = useState<string | null>(null);
  const [debitCardPhotoBackPreview, setDebitCardPhotoBackPreview] = useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Merchants
  const [merchants, setMerchants] = useState<MerchantEntry[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchBranch = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/branches/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBranchName(data.name);
        }
      } catch {
        // silent
      }
    };
    fetchBranch();
  }, [apiUrl, branchId, router]);

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (s: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const checkDuplicate = async (accountNumber: string) => {
    if (!accountNumber || accountNumber.length < 4) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/api/bank-accounts/check-duplicate?accountNumber=${encodeURIComponent(accountNumber)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.isDuplicate) {
        const branches = data.accounts.map((a: { fullName: string; branch: { name: string } }) => `${a.fullName} (${a.branch.name})`).join(', ');
        setDuplicateWarning(`This account number already exists: ${branches}`);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // silent
    }
  };

  // Merchant helpers
  const addMerchant = () => {
    setMerchants([...merchants, { name: '', type: 'PhonePe', merchantId: '', mobileNumber: '', balance: '', qrFile: null, qrPreview: null }]);
  };

  const updateMerchant = (idx: number, field: keyof MerchantEntry, value: string) => {
    setMerchants((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMerchant = (idx: number) => {
    setMerchants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMerchantQr = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMerchants((prev) =>
      prev.map((m, i) => i === idx ? { ...m, qrFile: file, qrPreview: URL.createObjectURL(file) } : m),
    );
  };

  const handleOtherDocs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setOtherDocuments((prev) => [...prev, ...Array.from(files)]);
  };

  const removeOtherDoc = (idx: number) => {
    setOtherDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('mobileNumber', form.mobileNumber);
      formData.append('aadharLinkedNumber', form.aadharLinkedNumber);
      formData.append('bankName', form.bankName);
      formData.append('accountNumber', form.accountNumber);
      formData.append('ifscCode', form.ifscCode);
      formData.append('bankBranch', form.bankBranch);
      formData.append('aadharNumber', form.aadharNumber);
      formData.append('panCardNumber', form.panCardNumber);
      formData.append('debitCardNumber', form.debitCardNumber);
      formData.append('debitCardExpiry', form.debitCardExpiry);
      formData.append('debitCardCvv', form.debitCardCvv);
      formData.append('netbankingUsername', form.netbankingUsername);
      formData.append('netbankingPassword', form.netbankingPassword);
      formData.append('bankBalance', form.bankBalance || '0');
      formData.append('branchId', branchId);

      // Document photos
      if (aadharFront) formData.append('aadharPhoto', aadharFront);
      if (aadharBack) formData.append('aadharPhotoBack', aadharBack);
      if (panFront) formData.append('panCardPhoto', panFront);
      if (panBack) formData.append('panCardPhotoBack', panBack);
      if (debitCardPhoto) formData.append('debitCardPhoto', debitCardPhoto);
      if (debitCardPhotoBack) formData.append('debitCardPhotoBack', debitCardPhotoBack);

      // Other documents
      for (const doc of otherDocuments) {
        formData.append('otherDocuments', doc);
      }

      // Merchants JSON
      if (merchants.length > 0) {
        const merchantsJson = merchants
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            type: m.type,
            merchantId: m.merchantId.trim() || undefined,
            mobileNumber: m.mobileNumber.trim() || undefined,
            balance: m.balance ? parseFloat(m.balance) : 0,
          }));
        formData.append('merchants', JSON.stringify(merchantsJson));

        // Merchant QR code files
        for (const m of merchants.filter((m) => m.name.trim())) {
          if (m.qrFile) {
            formData.append('merchantQrCodes', m.qrFile);
          }
        }
      }

      const res = await fetch(`${apiUrl}/api/bank-accounts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create bank account');
        return;
      }

      router.push(`/branches/${branchId}`);
    } catch {
      setError('Failed to create bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PhotoUploadField = ({
    id,
    label,
    file,
    preview,
    onChange,
  }: {
    id: string;
    label: string;
    file: File | null;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-slate-300 text-xs">{label}</Label>
      <div className="relative">
        <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
        <label
          htmlFor={id}
          className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-slate-400 cursor-pointer hover:border-blue-500/50 hover:text-slate-300 transition-colors text-sm"
        >
          <Camera className="h-4 w-4 text-blue-400" />
          {file ? file.name : `Upload ${label}`}
        </label>
      </div>
      {preview && (
        <img src={preview} alt={label} className="h-16 w-auto rounded-md border border-slate-600 mt-1" />
      )}
    </div>
  );

  return (
    <Sidebar>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link href="/branches" className="hover:text-white transition-colors">
            Branches
          </Link>
          <span>/</span>
          <Link
            href={`/branches/${branchId}`}
            className="hover:text-white transition-colors"
          >
            {branchName || 'Branch'}
          </Link>
          <span>/</span>
          <span className="text-white">New Bank Account</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Link href={`/branches/${branchId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Create Bank Account</h2>
            <p className="text-sm text-slate-400">
              Fill in the details to add a new bank account
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
              <User className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Full Name *</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Mobile Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      value={form.mobileNumber}
                      onChange={(e) => updateField('mobileNumber', e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Aadhar Linked Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={form.aadharLinkedNumber}
                    onChange={(e) => updateField('aadharLinkedNumber', e.target.value)}
                    placeholder="Enter Aadhar linked mobile number"
                    required
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Bank Details */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
              <Landmark className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Bank Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Bank Name *</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => updateField('bankName', e.target.value)}
                    placeholder="e.g. State Bank of India"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Account Number *</Label>
                  <Input
                    value={form.accountNumber}
                    onChange={(e) => updateField('accountNumber', e.target.value)}
                    onBlur={(e) => checkDuplicate(e.target.value)}
                    placeholder="Enter account number"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  {duplicateWarning && (
                    <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
                      {duplicateWarning}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">IFSC Code *</Label>
                  <Input
                    value={form.ifscCode}
                    onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Branch *</Label>
                  <Input
                    value={form.bankBranch}
                    onChange={(e) => updateField('bankBranch', e.target.value)}
                    placeholder="Bank branch name"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Bank Balance</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    value={form.bankBalance}
                    onChange={(e) => updateField('bankBalance', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Identity Documents with Photo Uploads */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Identity Documents</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Aadhar */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-orange-400" />
                  Aadhar Card
                </h4>
                <div className="space-y-2">
                  <Label className="text-slate-300">Aadhar Number *</Label>
                  <Input
                    value={form.aadharNumber}
                    onChange={(e) => updateField('aadharNumber', e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhotoUploadField
                    id="aadhar-front"
                    label="Aadhar Front"
                    file={aadharFront}
                    preview={aadharFrontPreview}
                    onChange={(e) => handlePhotoChange(e, setAadharFront, setAadharFrontPreview)}
                  />
                  <PhotoUploadField
                    id="aadhar-back"
                    label="Aadhar Back"
                    file={aadharBack}
                    preview={aadharBackPreview}
                    onChange={(e) => handlePhotoChange(e, setAadharBack, setAadharBackPreview)}
                  />
                </div>
              </div>

              {/* PAN */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-400" />
                  PAN Card
                </h4>
                <div className="space-y-2">
                  <Label className="text-slate-300">PAN Card Number *</Label>
                  <Input
                    value={form.panCardNumber}
                    onChange={(e) => updateField('panCardNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhotoUploadField
                    id="pan-front"
                    label="PAN Front"
                    file={panFront}
                    preview={panFrontPreview}
                    onChange={(e) => handlePhotoChange(e, setPanFront, setPanFrontPreview)}
                  />
                  <PhotoUploadField
                    id="pan-back"
                    label="PAN Back"
                    file={panBack}
                    preview={panBackPreview}
                    onChange={(e) => handlePhotoChange(e, setPanBack, setPanBackPreview)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Debit Card Details */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Debit Card Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Debit Card Number *</Label>
                <Input
                  value={form.debitCardNumber}
                  onChange={(e) => updateField('debitCardNumber', e.target.value)}
                  placeholder="e.g. 4111 1111 1111 1111"
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Expiry Date *</Label>
                  <Input
                    value={form.debitCardExpiry}
                    onChange={(e) => updateField('debitCardExpiry', e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">CVV *</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={form.debitCardCvv}
                    onChange={(e) => updateField('debitCardCvv', e.target.value)}
                    placeholder="***"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PhotoUploadField
                  id="debit-card-front"
                  label="Debit Card Front"
                  file={debitCardPhoto}
                  preview={debitCardPhotoPreview}
                  onChange={(e) => handlePhotoChange(e, setDebitCardPhoto, setDebitCardPhotoPreview)}
                />
                <PhotoUploadField
                  id="debit-card-back"
                  label="Debit Card Back"
                  file={debitCardPhotoBack}
                  preview={debitCardPhotoBackPreview}
                  onChange={(e) => handlePhotoChange(e, setDebitCardPhotoBack, setDebitCardPhotoBackPreview)}
                />
              </div>
            </div>
          </section>

          {/* Netbanking Details */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
              <Globe className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Netbanking Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Netbanking Username *</Label>
                  <Input
                    value={form.netbankingUsername}
                    onChange={(e) => updateField('netbankingUsername', e.target.value)}
                    placeholder="Netbanking username"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Netbanking Password *</Label>
                  <Input
                    type="password"
                    value={form.netbankingPassword}
                    onChange={(e) => updateField('netbankingPassword', e.target.value)}
                    placeholder="Netbanking password"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Linked Merchants */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Linked Merchants</h3>
                <span className="text-xs text-slate-500">({merchants.length})</span>
              </div>
              <button
                type="button"
                onClick={addMerchant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Merchant
              </button>
            </div>
            <div className="p-6">
              {merchants.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No merchants added yet. Click &quot;Add Merchant&quot; to link PhonePe, Google Pay, Paytm, etc.
                </p>
              ) : (
                <div className="space-y-4">
                  {merchants.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Merchant #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMerchant(idx)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Type *</Label>
                          <select
                            value={m.type}
                            onChange={(e) => updateMerchant(idx, 'type', e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm"
                          >
                            {MERCHANT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Name *</Label>
                          <Input
                            value={m.name}
                            onChange={(e) => updateMerchant(idx, 'name', e.target.value)}
                            placeholder="Merchant name"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Merchant ID</Label>
                          <Input
                            value={m.merchantId}
                            onChange={(e) => updateMerchant(idx, 'merchantId', e.target.value)}
                            placeholder="Optional"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Mobile Number</Label>
                          <Input
                            value={m.mobileNumber}
                            onChange={(e) => updateMerchant(idx, 'mobileNumber', e.target.value)}
                            placeholder="Optional"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Balance</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                            <Input
                              type="number"
                              step="0.01"
                              value={m.balance}
                              onChange={(e) => updateMerchant(idx, 'balance', e.target.value)}
                              placeholder="0.00"
                              className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">QR Code Photo</Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMerchantQr(idx, e)}
                              className="hidden"
                              id={`merchant-qr-${idx}`}
                            />
                            <label
                              htmlFor={`merchant-qr-${idx}`}
                              className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-slate-400 cursor-pointer hover:border-violet-500/50 hover:text-slate-300 transition-colors text-sm"
                            >
                              <QrCode className="h-4 w-4 text-violet-400" />
                              {m.qrFile ? m.qrFile.name : 'Upload QR'}
                            </label>
                          </div>
                          {m.qrPreview && (
                            <img src={m.qrPreview} alt="QR" className="h-12 w-auto rounded border border-slate-600 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Other Documents */}
          <section className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">Other Documents</h3>
                <span className="text-xs text-slate-500">({otherDocuments.length})</span>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  onChange={handleOtherDocs}
                  className="hidden"
                  id="other-docs"
                />
                <label
                  htmlFor="other-docs"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Documents
                </label>
              </div>
            </div>
            <div className="p-6">
              {otherDocuments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No additional documents. Use the upload button to add bank statements, agreements, etc.
                </p>
              ) : (
                <div className="space-y-2">
                  {otherDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                        <FileText className="h-4 w-4 text-teal-400 flex-shrink-0" />
                        <span className="truncate">{doc.name}</span>
                        <span className="text-xs text-slate-500">({(doc.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOtherDoc(idx)}
                        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4 pb-8">
            <Link href={`/branches/${branchId}`} className="flex-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700 h-12"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
            >
              {loading ? 'Creating Account...' : 'Create Bank Account'}
            </Button>
          </div>
        </form>
      </div>
    </Sidebar>
  );
}
