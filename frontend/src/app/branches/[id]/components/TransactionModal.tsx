'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BankAccount, AllBranch, TxType, txTypeLabel, txTypeColor, maskNumber } from './types';

interface TransactionModalProps {
  account: BankAccount;
  txType: TxType;
  txAmount: string;
  txDescription: string;
  txToAccountId: string;
  txTargetBranchId: string;
  txError: string;
  txSubmitting: boolean;
  branchId: string;
  allBranches: AllBranch[];
  transferTargetAccounts: { id: string; fullName: string; accountNumber: string }[];
  setTxAmount: (v: string) => void;
  setTxDescription: (v: string) => void;
  setTxToAccountId: (v: string) => void;
  setTxTargetBranchId: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function TransactionModal({
  account,
  txType,
  txAmount,
  txDescription,
  txToAccountId,
  txTargetBranchId,
  txError,
  txSubmitting,
  branchId,
  allBranches,
  transferTargetAccounts,
  setTxAmount,
  setTxDescription,
  setTxToAccountId,
  setTxTargetBranchId,
  onSubmit,
  onClose,
}: TransactionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-slate-700 p-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className={`text-lg font-semibold ${txTypeColor(txType)}`}>
              {txTypeLabel(txType)}
            </h3>
            <p className="text-xs text-slate-400">
              {account.fullName} &middot; Balance: ₹{account.bankBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {txError && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-sm">
              {txError}
            </div>
          )}

          <div>
            <Label className="text-slate-400 text-xs">Amount (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="bg-slate-800/60 border-slate-700 text-white mt-1 text-lg"
              min="0.01"
              step="0.01"
            />
          </div>

          {txType === 'TRANSFER' && (
            <div>
              <Label className="text-slate-400 text-xs">Transfer To (Same Branch)</Label>
              <select
                value={txToAccountId}
                onChange={(e) => setTxToAccountId(e.target.value)}
                className="w-full mt-1 bg-slate-800/60 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select account...</option>
                {transferTargetAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({maskNumber(a.accountNumber)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {txType === 'OUT_TRANSFER' && (
            <>
              <div>
                <Label className="text-slate-400 text-xs">Target Branch</Label>
                <select
                  value={txTargetBranchId}
                  onChange={(e) => { setTxTargetBranchId(e.target.value); setTxToAccountId(''); }}
                  className="w-full mt-1 bg-slate-800/60 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select branch...</option>
                  {allBranches
                    .filter((b) => b.id !== branchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
              {txTargetBranchId && (
                <div>
                  <Label className="text-slate-400 text-xs">Transfer To Account</Label>
                  <select
                    value={txToAccountId}
                    onChange={(e) => setTxToAccountId(e.target.value)}
                    className="w-full mt-1 bg-slate-800/60 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select account...</option>
                    {transferTargetAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({maskNumber(a.accountNumber)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <Label className="text-slate-400 text-xs">Description (Optional)</Label>
            <Input
              placeholder="Add a note..."
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="bg-slate-800/60 border-slate-700 text-white mt-1"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={txSubmitting}
            className={`w-full text-white ${
              txType === 'DEPOSIT'
                ? 'bg-green-600 hover:bg-green-700'
                : txType === 'WITHDRAWAL'
                ? 'bg-red-600 hover:bg-red-700'
                : txType === 'TRANSFER'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {txSubmitting ? 'Processing...' : `Confirm ${txTypeLabel(txType)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
