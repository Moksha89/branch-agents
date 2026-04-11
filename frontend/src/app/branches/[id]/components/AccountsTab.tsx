'use client';

import Link from 'next/link';
import { Plus, Landmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BankAccount, AccountStatus, TxType, STATUS_CONFIG } from './types';

interface AccountsTabProps {
  branchId: string;
  accounts: BankAccount[];
  filteredAccounts: BankAccount[];
  accountSearch: string;
  setAccountSearch: (v: string) => void;
  statusDropdownAccountId: string | null;
  setStatusDropdownAccountId: (v: string | null) => void;
  statusChanging: boolean;
  onStatusChange: (account: BankAccount, newStatus: AccountStatus) => void;
  onAccountClick: (account: BankAccount) => void;
  onTxOpen: (account: BankAccount, type: TxType) => void;
}

export default function AccountsTab({
  branchId,
  accounts,
  filteredAccounts,
  accountSearch,
  setAccountSearch,
  statusDropdownAccountId,
  setStatusDropdownAccountId,
  statusChanging,
  onStatusChange,
  onAccountClick,
  onTxOpen,
}: AccountsTabProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <Landmark className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No bank accounts yet</h3>
        <p className="text-slate-500 mb-6">Add the first bank account to this branch</p>
        <Link href={`/branches/${branchId}/accounts/new`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by name, bank, account #, or mobile..."
          value={accountSearch}
          onChange={(e) => setAccountSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>
      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-600/50">
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40 w-[30px]">#</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Name</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Bank</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Account #</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">IFSC</th>
                <th className="text-left px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Mobile</th>
                <th className="text-right px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Balance</th>
                <th className="text-center px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Status</th>
                <th className="text-center px-3 py-2.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account, idx) => (
                <tr
                  key={account.id}
                  className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'
                  }`}
                  onClick={() => onAccountClick(account)}
                >
                  <td className="px-3 py-2 text-slate-500 text-xs border-r border-slate-700/30 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-slate-700/30 whitespace-nowrap">
                    <span className="text-white font-medium">{account.fullName}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-300 border-r border-slate-700/30 whitespace-nowrap">{account.bankName}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 font-mono text-xs whitespace-nowrap">{account.accountNumber}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 font-mono text-xs">{account.ifscCode}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 whitespace-nowrap">{account.mobileNumber}</td>
                  <td className="px-3 py-2 text-right border-r border-slate-700/30 whitespace-nowrap">
                    <span className="text-green-400 font-semibold">₹{account.bankBalance.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-700/30 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusDropdownAccountId(
                          statusDropdownAccountId === account.id ? null : account.id
                        );
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                        STATUS_CONFIG[account.status].bg
                      } ${STATUS_CONFIG[account.status].color} ${STATUS_CONFIG[account.status].border}`}
                      title="Click to change status"
                    >
                      {STATUS_CONFIG[account.status].label}
                      <RefreshCw className="h-3 w-3" />
                    </button>
                    {statusDropdownAccountId === account.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-40 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(Object.keys(STATUS_CONFIG) as AccountStatus[]).map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          const isCurrent = s === account.status;
                          return (
                            <button
                              key={s}
                              disabled={isCurrent || statusChanging}
                              onClick={() => onStatusChange(account, s)}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                                isCurrent
                                  ? 'bg-slate-700/50 cursor-default'
                                  : 'hover:bg-slate-700/50 cursor-pointer'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                s === 'ACTIVE' ? 'bg-green-400' :
                                s === 'DEBIT_FREEZE' ? 'bg-yellow-400' :
                                s === 'CREDIT_FREEZE' ? 'bg-orange-400' :
                                s === 'CYBER' ? 'bg-red-400' : 'bg-slate-400'
                              }`} />
                              <span className={isCurrent ? cfg.color + ' font-medium' : 'text-slate-300'}>
                                {cfg.label}
                              </span>
                              {isCurrent && <span className="ml-auto text-slate-500">•</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onTxOpen(account, 'DEPOSIT'); }}
                        className="px-1.5 py-1 rounded text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors"
                        title="Deposit"
                      >D</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onTxOpen(account, 'WITHDRAWAL'); }}
                        className="px-1.5 py-1 rounded text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                        title="Withdrawal"
                      >W</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onTxOpen(account, 'TRANSFER'); }}
                        className="px-1.5 py-1 rounded text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                        title="Internal Transfer"
                      >T</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onTxOpen(account, 'OUT_TRANSFER'); }}
                        className="px-1.5 py-1 rounded text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
                        title="Out Transfer"
                      >OT</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
