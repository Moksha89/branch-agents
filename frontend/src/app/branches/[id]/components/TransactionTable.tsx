'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Transaction, txTypeBadge, txTypeShort } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface TransactionTableProps {
  txList: Transaction[];
  contextAccountId?: string;
  onReversalComplete?: () => void;
}

export default function TransactionTable({ txList, contextAccountId, onReversalComplete }: TransactionTableProps) {
  const [reversalTx, setReversalTx] = useState<Transaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalLoading, setReversalLoading] = useState(false);
  const [reversalError, setReversalError] = useState('');
  const [reversalSuccess, setReversalSuccess] = useState('');

  const handleReverse = async () => {
    if (!reversalTx) return;
    setReversalLoading(true);
    setReversalError('');
    setReversalSuccess('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/api/transactions/${reversalTx.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reversalReason || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setReversalSuccess('Transaction reversed successfully');
        setTimeout(() => {
          setReversalTx(null);
          setReversalReason('');
          setReversalSuccess('');
          if (onReversalComplete) onReversalComplete();
        }, 1500);
      } else {
        setReversalError(data.message || 'Failed to reverse transaction');
      }
    } catch {
      setReversalError('Network error');
    }
    setReversalLoading(false);
  };

  return (
    <>
      <div className="bg-slate-800/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-3 text-slate-500 font-medium text-xs uppercase">Type</th>
                <th className="text-left p-3 text-slate-500 font-medium text-xs uppercase">Account</th>
                <th className="text-right p-3 text-slate-500 font-medium text-xs uppercase">Amount</th>
                <th className="text-right p-3 text-slate-500 font-medium text-xs uppercase">Balance</th>
                <th className="text-left p-3 text-slate-500 font-medium text-xs uppercase">Description</th>
                <th className="text-left p-3 text-slate-500 font-medium text-xs uppercase">Date</th>
                <th className="text-center p-3 text-slate-500 font-medium text-xs uppercase w-[60px]">Rev</th>
              </tr>
            </thead>
            <tbody>
              {txList.map((tx) => {
                const isCredit = contextAccountId
                  ? tx.type === 'DEPOSIT' || (tx.toAccountId === contextAccountId && tx.fromAccountId !== contextAccountId)
                  : tx.type === 'DEPOSIT';
                const isReversal = (tx as Transaction & { isReversal?: boolean }).isReversal;
                return (
                  <tr key={tx.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 ${isReversal ? 'opacity-60' : ''}`}>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${txTypeBadge(tx.type)}`}>
                        {txTypeShort(tx.type)}
                        {isReversal && <RotateCcw className="h-3 w-3" />}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      {tx.fromAccount.fullName}
                      {tx.toAccount && (
                        <span className="text-slate-500"> → {tx.toAccount.fullName}</span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-medium ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      ₹{tx.balanceAfter.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-400 max-w-[200px] truncate" title={tx.description || ''}>
                      {tx.description || '—'}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 text-center">
                      {!isReversal && (
                        <button
                          onClick={() => { setReversalTx(tx); setReversalReason(''); setReversalError(''); setReversalSuccess(''); }}
                          className="p-1 rounded hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors"
                          title="Reverse this transaction"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Modal */}
      {reversalTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setReversalTx(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Reverse Transaction</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will create a reversal transaction and restore the account balance(s).
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Type:</span>
                <span className={`font-medium ${
                  reversalTx.type === 'DEPOSIT' ? 'text-green-400' :
                  reversalTx.type === 'WITHDRAWAL' ? 'text-red-400' :
                  'text-blue-400'
                }`}>{reversalTx.type}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Amount:</span>
                <span className="text-white font-mono">₹{reversalTx.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="text-white">{reversalTx.fromAccount.fullName}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Why is this transaction being reversed?"
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
              />
            </div>
            {reversalError && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{reversalError}</div>
            )}
            {reversalSuccess && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">{reversalSuccess}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReverse}
                disabled={reversalLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reversalLoading ? 'Reversing...' : 'Reverse Transaction'}
              </button>
              <button
                onClick={() => setReversalTx(null)}
                className="px-4 py-2 rounded-lg text-slate-400 text-sm hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
