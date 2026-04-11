'use client';

import { Transaction, txTypeBadge, txTypeShort } from './types';

interface TransactionTableProps {
  txList: Transaction[];
  contextAccountId?: string;
}

export default function TransactionTable({ txList, contextAccountId }: TransactionTableProps) {
  return (
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
            </tr>
          </thead>
          <tbody>
            {txList.map((tx) => {
              const isCredit = contextAccountId
                ? tx.type === 'DEPOSIT' || (tx.toAccountId === contextAccountId && tx.fromAccountId !== contextAccountId)
                : tx.type === 'DEPOSIT';
              return (
                <tr key={tx.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${txTypeBadge(tx.type)}`}>
                      {txTypeShort(tx.type)}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
