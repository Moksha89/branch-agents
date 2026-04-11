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
} from 'lucide-react';
import Link from 'next/link';

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

  const [aadharPhoto, setAadharPhoto] = useState<File | null>(null);
  const [panCardPhoto, setPanCardPhoto] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
  const [panPreview, setPanPreview] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchBranch = async () => {
      try {
        const res = await fetch(`${apiUrl}/branches/${branchId}`, {
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'aadhar' | 'pan',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'aadhar') {
      setAadharPhoto(file);
      setAadharPreview(URL.createObjectURL(file));
    } else {
      setPanCardPhoto(file);
      setPanPreview(URL.createObjectURL(file));
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

      if (aadharPhoto) {
        formData.append('aadharPhoto', aadharPhoto);
      }
      if (panCardPhoto) {
        formData.append('panCardPhoto', panCardPhoto);
      }

      const res = await fetch(`${apiUrl}/bank-accounts`, {
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
                    placeholder="Enter account number"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
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

          {/* Identity Documents */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-slate-300">Aadhar Photo</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'aadhar')}
                        className="hidden"
                        id="aadhar-upload"
                      />
                      <label
                        htmlFor="aadhar-upload"
                        className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-slate-400 cursor-pointer hover:border-blue-500/50 hover:text-slate-300 transition-colors text-sm"
                      >
                        <Upload className="h-4 w-4" />
                        {aadharPhoto ? aadharPhoto.name : 'Upload Aadhar photo'}
                      </label>
                    </div>
                    {aadharPreview && (
                      <img
                        src={aadharPreview}
                        alt="Aadhar preview"
                        className="h-20 w-auto rounded-md border border-slate-600 mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* PAN */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-400" />
                  PAN Card
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-slate-300">PAN Card Photo</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'pan')}
                        className="hidden"
                        id="pan-upload"
                      />
                      <label
                        htmlFor="pan-upload"
                        className="flex items-center gap-2 h-10 px-3 rounded-md border border-slate-600 bg-slate-700/50 text-slate-400 cursor-pointer hover:border-blue-500/50 hover:text-slate-300 transition-colors text-sm"
                      >
                        <Upload className="h-4 w-4" />
                        {panCardPhoto ? panCardPhoto.name : 'Upload PAN card photo'}
                      </label>
                    </div>
                    {panPreview && (
                      <img
                        src={panPreview}
                        alt="PAN preview"
                        className="h-20 w-auto rounded-md border border-slate-600 mt-2"
                      />
                    )}
                  </div>
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
