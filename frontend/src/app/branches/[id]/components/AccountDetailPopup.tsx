'use client';

import { X, Pencil, Trash2, User, Landmark, Shield, Wallet, Globe, IndianRupee, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BankAccount, AccountStatus, Transaction, STATUS_CONFIG } from './types';
import TransactionTable from './TransactionTable';
import MerchantsSection from './MerchantsSection';
import DocumentsSection from './DocumentsSection';

interface AccountDetailPopupProps {
  account: BankAccount;
  popupMode: 'view' | 'edit';
  editForm: Record<string, string | number | undefined>;
  setEditForm: (form: Record<string, string | number | undefined>) => void;
  saving: boolean;
  deleting: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  txLoading: boolean;
  acctTxDateFrom: string;
  acctTxDateTo: string;
  setAcctTxDateFrom: (v: string) => void;
  setAcctTxDateTo: (v: string) => void;
  onEdit: (account: BankAccount) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onViewMode: (account: BankAccount) => void;
  onDownloadCSV: (txList: Transaction[], filename: string, accountId?: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-200">{value ?? '—'}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
      {config.label}
    </span>
  );
}

export default function AccountDetailPopup({
  account,
  popupMode,
  editForm,
  setEditForm,
  saving,
  deleting,
  showDeleteConfirm,
  setShowDeleteConfirm,
  transactions,
  filteredTransactions,
  txLoading,
  acctTxDateFrom,
  acctTxDateTo,
  setAcctTxDateFrom,
  setAcctTxDateTo,
  onEdit,
  onSave,
  onDelete,
  onClose,
  onViewMode,
  onDownloadCSV,
}: AccountDetailPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
              {account.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {popupMode === 'view' ? account.fullName : 'Edit Account'}
                </h3>
                {popupMode === 'view' && <StatusBadge status={account.status} />}
              </div>
              <p className="text-xs text-slate-400">
                {popupMode === 'view' ? account.bankName : account.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {popupMode === 'view' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(account)}
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
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mx-5 mt-4 p-4 bg-red-950/40 border border-red-800/50 rounded-xl">
            <p className="text-red-300 text-sm mb-3">
              Are you sure you want to delete <strong>{account.fullName}</strong>&apos;s account? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onDelete}
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
                <DetailRow label="Full Name" value={account.fullName} />
                <DetailRow label="Mobile Number" value={account.mobileNumber} />
                <DetailRow label="Aadhar Linked Number" value={account.aadharLinkedNumber} />
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="h-4 w-4 text-green-400" />
                <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Bank Details</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-800/40 rounded-xl p-4">
                <DetailRow label="Bank Name" value={account.bankName} />
                <DetailRow label="Account Number" value={account.accountNumber} />
                <DetailRow label="IFSC Code" value={account.ifscCode} />
                <DetailRow label="Bank Branch" value={account.bankBranch} />
                <DetailRow label="Balance" value={`₹ ${Number(account.bankBalance).toLocaleString('en-IN')}`} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                  <StatusBadge status={account.status} />
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Identity Documents</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-800/40 rounded-xl p-4">
                <DetailRow label="Aadhar Number" value={account.aadharNumber} />
                <DetailRow label="PAN Card Number" value={account.panCardNumber} />
              </div>
            </div>

            {/* Debit Card */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-orange-400" />
                <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Debit Card</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-slate-800/40 rounded-xl p-4">
                <DetailRow label="Card Number" value={account.debitCardNumber} />
                <DetailRow label="Expiry" value={account.debitCardExpiry} />
                <DetailRow label="CVV" value={account.debitCardCvv} />
              </div>
            </div>

            {/* Netbanking */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Netbanking</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-800/40 rounded-xl p-4">
                <DetailRow label="Username" value={account.netbankingUsername} />
                <DetailRow label="Password" value={account.netbankingPassword} />
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Transaction History</h4>
                </div>
                {filteredTransactions.length > 0 && (
                  <button
                    onClick={() => onDownloadCSV(filteredTransactions, `${account.fullName.replace(/\s+/g, '_')}_Statement`, account.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs font-medium"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                )}
              </div>
              {transactions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500">From:</label>
                    <input
                      type="date"
                      value={acctTxDateFrom}
                      onChange={(e) => setAcctTxDateFrom(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500">To:</label>
                    <input
                      type="date"
                      value={acctTxDateTo}
                      onChange={(e) => setAcctTxDateTo(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {(acctTxDateFrom || acctTxDateTo) && (
                    <button
                      onClick={() => { setAcctTxDateFrom(''); setAcctTxDateTo(''); }}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">{filteredTransactions.length} of {transactions.length}</span>
                </div>
              )}
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6 bg-slate-800/40 rounded-xl">
                  <p className="text-slate-500 text-sm">No transactions yet</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-6 bg-slate-800/40 rounded-xl">
                  <p className="text-slate-500 text-sm">No transactions found for the selected date range</p>
                </div>
              ) : (
                <TransactionTable txList={filteredTransactions} contextAccountId={account.id} />
              )}
            </div>

            {/* Linked Merchants */}
            <div className="bg-slate-800/40 rounded-xl p-4">
              <MerchantsSection accountId={account.id} />
            </div>

            {/* Documents */}
            <div className="bg-slate-800/40 rounded-xl p-4">
              <DocumentsSection accountId={account.id} />
            </div>

            {/* Meta */}
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
              Created by {account.createdBy.fullName} on{' '}
              {new Date(account.createdAt).toLocaleDateString('en-IN', {
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
                    value={(editForm.fullName as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Mobile Number</Label>
                  <Input
                    value={(editForm.mobileNumber as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Aadhar Linked Number</Label>
                  <Input
                    value={(editForm.aadharLinkedNumber as string) || ''}
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
                    value={(editForm.bankName as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Account Number</Label>
                  <Input
                    value={(editForm.accountNumber as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">IFSC Code</Label>
                  <Input
                    value={(editForm.ifscCode as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Bank Branch</Label>
                  <Input
                    value={(editForm.bankBranch as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, bankBranch: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Bank Balance</Label>
                  <p className="text-sm text-slate-300 mt-1 px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-md">
                    ₹{(Number(editForm.bankBalance) || 0).toLocaleString('en-IN')}
                    <span className="text-slate-500 text-xs ml-2">(use transactions to change)</span>
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Account Status</Label>
                  <select
                    value={(editForm.status as string) || 'ACTIVE'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AccountStatus })}
                    className="w-full mt-1 bg-slate-800/60 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DEBIT_FREEZE">Debit Freeze</option>
                    <option value="CREDIT_FREEZE">Credit Freeze</option>
                    <option value="CYBER">Cyber</option>
                    <option value="CLOSED">Closed</option>
                  </select>
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
                    value={(editForm.aadharNumber as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">PAN Card Number</Label>
                  <Input
                    value={(editForm.panCardNumber as string) || ''}
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
                    value={(editForm.debitCardNumber as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, debitCardNumber: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Expiry</Label>
                  <Input
                    value={(editForm.debitCardExpiry as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, debitCardExpiry: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">CVV</Label>
                  <Input
                    value={(editForm.debitCardCvv as string) || ''}
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
                    value={(editForm.netbankingUsername as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, netbankingUsername: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Password</Label>
                  <Input
                    value={(editForm.netbankingPassword as string) || ''}
                    onChange={(e) => setEditForm({ ...editForm, netbankingPassword: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-700/30">
              <Button
                onClick={onSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onViewMode(account)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
