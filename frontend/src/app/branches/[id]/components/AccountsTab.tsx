'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Landmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BankAccount, AccountStatus, TxType, STATUS_CONFIG } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

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
  onRefresh?: () => void;
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
  onRefresh,
}: AccountsTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AccountStatus | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    setBulkMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/api/bank-accounts/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountIds: Array.from(selectedIds), status: bulkStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkMessage(`Updated ${data.updated} account(s) to ${STATUS_CONFIG[bulkStatus as AccountStatus]?.label || bulkStatus}`);
        setSelectedIds(new Set());
        setBulkStatus('');
        if (onRefresh) onRefresh();
      } else {
        setBulkMessage(data.message || 'Bulk update failed');
      }
    } catch {
      setBulkMessage('Network error');
    }
    setBulkLoading(false);
    setTimeout(() => setBulkMessage(''), 3000);
  };

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
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder="Search by name, bank, account #, or mobile..."
          value={accountSearch}
          onChange={(e) => setAccountSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-xs text-blue-300 font-medium">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as AccountStatus | '')}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-xs text-white"
          >
            <option value="">Change status to...</option>
            {(Object.keys(STATUS_CONFIG) as AccountStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <button
            onClick={handleBulkStatusChange}
            disabled={!bulkStatus || bulkLoading}
            className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkLoading ? 'Updating...' : 'Apply'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
          {bulkMessage && (
            <span className="text-xs text-green-400 ml-2">{bulkMessage}</span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-600/50">
                <th className="px-2 py-2.5 border-r border-slate-700/40 w-[30px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-500 bg-slate-700"
                  />
                </th>
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
                  } ${selectedIds.has(account.id) ? 'bg-blue-500/10' : ''}`}
                  onClick={() => onAccountClick(account)}
                >
                  <td className="px-2 py-2 border-r border-slate-700/30 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(account.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(account.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-500 bg-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs border-r border-slate-700/30 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-slate-700/30 whitespace-nowrap">
                    <span className="text-white font-medium">{account.fullName}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-300 border-r border-slate-700/30 whitespace-nowrap">{account.bankName}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 font-mono text-xs whitespace-nowrap">{account.accountNumber}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 font-mono text-xs">{account.ifscCode}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-700/30 whitespace-nowrap">{account.mobileNumber}</td>
                  <td className="px-3 py-2 text-right border-r border-slate-700/30 whitespace-nowrap">
                    <span className="text-green-400 font-semibold">₹{Number(account.bankBalance).toLocaleString('en-IN')}</span>
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
