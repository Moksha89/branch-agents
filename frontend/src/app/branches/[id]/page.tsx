'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Landmark,
  IndianRupee,
  X,
  Eye,
  Pencil,
  Trash2,
  Shield,
  Wallet,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

interface BankAccount {
  id: string;
  fullName: string;
  mobileNumber: string;
  aadharLinkedNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  aadharNumber: string;
  aadharPhoto: string | null;
  panCardNumber: string;
  panCardPhoto: string | null;
  debitCardNumber: string;
  debitCardExpiry: string;
  debitCardCvv: string;
  netbankingUsername: string;
  netbankingPassword: string;
  bankBalance: number;
  createdAt: string;
  createdBy: { id: string; fullName: string; username: string };
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bankAccounts: BankAccount[];
}

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Popup state
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [popupMode, setPopupMode] = useState<'view' | 'edit' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<BankAccount>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchBranch = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/branches/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setError('Branch not found');
        return;
      }
      const data = await res.json();
      setBranch(data);
    } catch {
      setError('Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '****' + num.slice(-4);
  };

  const openViewPopup = (account: BankAccount) => {
    setSelectedAccount(account);
    setPopupMode('view');
    setShowDeleteConfirm(false);
  };

  const openEditPopup = (account: BankAccount) => {
    setSelectedAccount(account);
    setEditForm({
      fullName: account.fullName,
      mobileNumber: account.mobileNumber,
      aadharLinkedNumber: account.aadharLinkedNumber,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      bankBranch: account.bankBranch,
      aadharNumber: account.aadharNumber,
      panCardNumber: account.panCardNumber,
      debitCardNumber: account.debitCardNumber,
      debitCardExpiry: account.debitCardExpiry,
      debitCardCvv: account.debitCardCvv,
      netbankingUsername: account.netbankingUsername,
      netbankingPassword: account.netbankingPassword,
      bankBalance: account.bankBalance,
    });
    setPopupMode('edit');
    setShowDeleteConfirm(false);
  };

  const closePopup = () => {
    setSelectedAccount(null);
    setPopupMode(null);
    setShowDeleteConfirm(false);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/bank-accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          bankBalance: Number(editForm.bankBalance) || 0,
        }),
      });
      if (res.ok) {
        closePopup();
        await fetchBranch();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/bank-accounts/${selectedAccount.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        closePopup();
        await fetchBranch();
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-200">{value ?? '—'}</span>
    </div>
  );

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/branches">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branches
              </Button>
            </Link>
          </div>
        ) : branch ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Link href="/branches" className="hover:text-white transition-colors">
                Branches
              </Link>
              <span>/</span>
              <span className="text-white">{branch.name}</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{branch.name}</h2>
                  <p className="text-sm text-slate-400">
                    Code: {branch.code}
                    {branch.city && ` | ${branch.city}`}
                    {branch.state && `, ${branch.state}`}
                  </p>
                </div>
              </div>
              <Link href={`/branches/${branch.id}/accounts/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </Link>
            </div>

            {/* Bank accounts */}
            {branch.bankAccounts.length === 0 ? (
              <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <Landmark className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No bank accounts yet
                </h3>
                <p className="text-slate-500 mb-6">
                  Add the first bank account to this branch
                </p>
                <Link href={`/branches/${branch.id}/accounts/new`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {branch.bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => openViewPopup(account)}
                    className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {account.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{account.fullName}</h4>
                          <p className="text-sm text-slate-400">{account.bankName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-semibold text-green-400">
                          {account.bankBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/30">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">A/C: {maskNumber(account.accountNumber)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Landmark className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">IFSC: {account.ifscCode}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">{account.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">By: {account.createdBy.fullName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== POPUP OVERLAY ===== */}
            {selectedAccount && popupMode && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closePopup}>
                <div
                  className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Popup Header */}
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-5 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                        {selectedAccount.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {popupMode === 'view' ? selectedAccount.fullName : 'Edit Account'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {popupMode === 'view' ? selectedAccount.bankName : selectedAccount.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {popupMode === 'view' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditPopup(selectedAccount)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      <button onClick={closePopup} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm && (
                    <div className="mx-5 mt-4 p-4 bg-red-950/40 border border-red-800/50 rounded-xl">
                      <p className="text-red-300 text-sm mb-3">
                        Are you sure you want to delete <strong>{selectedAccount.fullName}</strong>&apos;s account? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* VIEW MODE */}
                  {popupMode === 'view' && (
                    <div className="p-5 space-y-6">
                      {/* Personal Information */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-blue-400" />
                          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Personal Information</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-800/40 rounded-xl p-4">
                          <DetailRow label="Full Name" value={selectedAccount.fullName} />
                          <DetailRow label="Mobile Number" value={selectedAccount.mobileNumber} />
                          <DetailRow label="Aadhar Linked Number" value={selectedAccount.aadharLinkedNumber} />
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Landmark className="h-4 w-4 text-green-400" />
                          <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Bank Details</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-800/40 rounded-xl p-4">
                          <DetailRow label="Bank Name" value={selectedAccount.bankName} />
                          <DetailRow label="Account Number" value={selectedAccount.accountNumber} />
                          <DetailRow label="IFSC Code" value={selectedAccount.ifscCode} />
                          <DetailRow label="Bank Branch" value={selectedAccount.bankBranch} />
                          <DetailRow label="Balance" value={`₹ ${selectedAccount.bankBalance.toLocaleString('en-IN')}`} />
                        </div>
                      </div>

                      {/* Identity Documents */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Identity Documents</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-slate-800/40 rounded-xl p-4">
                          <DetailRow label="Aadhar Number" value={selectedAccount.aadharNumber} />
                          <DetailRow label="PAN Card Number" value={selectedAccount.panCardNumber} />
                        </div>
                      </div>

                      {/* Debit Card */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="h-4 w-4 text-orange-400" />
                          <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Debit Card</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4 bg-slate-800/40 rounded-xl p-4">
                          <DetailRow label="Card Number" value={selectedAccount.debitCardNumber} />
                          <DetailRow label="Expiry" value={selectedAccount.debitCardExpiry} />
                          <DetailRow label="CVV" value={selectedAccount.debitCardCvv} />
                        </div>
                      </div>

                      {/* Netbanking */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Netbanking</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-slate-800/40 rounded-xl p-4">
                          <DetailRow label="Username" value={selectedAccount.netbankingUsername} />
                          <DetailRow label="Password" value={selectedAccount.netbankingPassword} />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                        Created by {selectedAccount.createdBy.fullName} on{' '}
                        {new Date(selectedAccount.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                  {/* EDIT MODE */}
                  {popupMode === 'edit' && (
                    <div className="p-5 space-y-5">
                      {/* Personal Information */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-blue-400" />
                          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Personal Information</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Full Name</Label>
                            <Input
                              value={editForm.fullName || ''}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Mobile Number</Label>
                            <Input
                              value={editForm.mobileNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Aadhar Linked Number</Label>
                            <Input
                              value={editForm.aadharLinkedNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, aadharLinkedNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Landmark className="h-4 w-4 text-green-400" />
                          <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Bank Details</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Bank Name</Label>
                            <Input
                              value={editForm.bankName || ''}
                              onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Account Number</Label>
                            <Input
                              value={editForm.accountNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">IFSC Code</Label>
                            <Input
                              value={editForm.ifscCode || ''}
                              onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Bank Branch</Label>
                            <Input
                              value={editForm.bankBranch || ''}
                              onChange={(e) => setEditForm({ ...editForm, bankBranch: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Bank Balance</Label>
                            <Input
                              type="number"
                              value={editForm.bankBalance || 0}
                              onChange={(e) => setEditForm({ ...editForm, bankBalance: Number(e.target.value) })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Identity Documents */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Identity Documents</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Aadhar Number</Label>
                            <Input
                              value={editForm.aadharNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">PAN Card Number</Label>
                            <Input
                              value={editForm.panCardNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, panCardNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Debit Card */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="h-4 w-4 text-orange-400" />
                          <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Debit Card</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Card Number</Label>
                            <Input
                              value={editForm.debitCardNumber || ''}
                              onChange={(e) => setEditForm({ ...editForm, debitCardNumber: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Expiry</Label>
                            <Input
                              value={editForm.debitCardExpiry || ''}
                              onChange={(e) => setEditForm({ ...editForm, debitCardExpiry: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">CVV</Label>
                            <Input
                              value={editForm.debitCardCvv || ''}
                              onChange={(e) => setEditForm({ ...editForm, debitCardCvv: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Netbanking */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Netbanking</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Username</Label>
                            <Input
                              value={editForm.netbankingUsername || ''}
                              onChange={(e) => setEditForm({ ...editForm, netbankingUsername: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Password</Label>
                            <Input
                              value={editForm.netbankingPassword || ''}
                              onChange={(e) => setEditForm({ ...editForm, netbankingPassword: e.target.value })}
                              className="bg-slate-800/60 border-slate-700 text-white mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-700/30">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => openViewPopup(selectedAccount)}
                          className="text-slate-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Sidebar>
  );
}
