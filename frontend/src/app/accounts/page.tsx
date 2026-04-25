'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  IndianRupee,
  Search,
  Building2,
  Lock,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  Snowflake,
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import { showToast } from '@/components/ui/toast';
import Pagination from '@/components/ui/pagination';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface AccountItem {
  id: string;
  fullName: string;
  bankName: string;
  accountNumber: string;
  bankBalance: number;
  status: string;
  branchId: string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
}

interface BranchItem {
  id: string;
  name: string;
  code: string;
}

interface Summary {
  totalAccounts: number;
  activeCount: number;
  debitFreezeCount: number;
  creditFreezeCount: number;
  cyberCount: number;
  closedCount: number;
  totalAvailableAmount: number;
  freezeAmount: number;
  totalBalance: number;
}

const STATUS_TABS = [
  { key: 'ALL', label: 'All', icon: Landmark },
  { key: 'ACTIVE', label: 'Active', icon: CheckCircle2 },
  { key: 'DEBIT_FREEZE', label: 'Debit Freeze', icon: Lock },
  { key: 'CREDIT_FREEZE', label: 'Credit Freeze', icon: Snowflake },
  { key: 'CYBER', label: 'Cyber', icon: ShieldAlert },
  { key: 'CLOSED', label: 'Closed', icon: XCircle },
];

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DEBIT_FREEZE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CREDIT_FREEZE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CYBER: 'bg-red-500/20 text-red-400 border-red-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  DEBIT_FREEZE: 'Debit Freeze',
  CREDIT_FREEZE: 'Credit Freeze',
  CYBER: 'Cyber',
  CLOSED: 'Closed',
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState('ALL');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const getToken = () => localStorage.getItem('accessToken');

  const fetchAccounts = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.set('status', activeTab);
      if (filterBranchId) params.set('branchId', filterBranchId);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`${API}/api/bank-accounts/all-accounts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data.accounts);
      setSummary(data.summary);
    } catch {
      showToast('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, activeTab, filterBranchId, debouncedSearch]);

  const fetchBranches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBranches(data);
    } catch { /* ignore */ }
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterBranchId, debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const getTabCount = (key: string): number => {
    if (!summary) return 0;
    switch (key) {
      case 'ALL': return summary.totalAccounts;
      case 'ACTIVE': return summary.activeCount;
      case 'DEBIT_FREEZE': return summary.debitFreezeCount;
      case 'CREDIT_FREEZE': return summary.creditFreezeCount;
      case 'CYBER': return summary.cyberCount;
      case 'CLOSED': return summary.closedCount;
      default: return 0;
    }
  };

  return (
    <Sidebar>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Accounts</h1>
              <p className="text-sm text-slate-400">All bank accounts across branches</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Landmark className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">Total Accounts</p>
                <p className="text-lg font-semibold text-white">{summary?.totalAccounts ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">Available Amount</p>
                <p className="text-lg font-semibold text-emerald-400 truncate">
                  ₹{(summary?.totalAvailableAmount ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">Freeze Amount</p>
                <p className="text-lg font-semibold text-amber-400 truncate">
                  ₹{(summary?.freezeAmount ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-4 w-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">Total Balance</p>
                <p className="text-lg font-semibold text-blue-400 truncate">
                  ₹{(summary?.totalBalance ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_TABS.map((tab) => {
            const count = getTabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, account number, or bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative sm:w-48">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Accounts Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
            <Landmark className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No accounts found</p>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab !== 'ALL'
                ? `No ${statusLabels[activeTab]?.toLowerCase()} accounts`
                : searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Create accounts from the Branches page'}
            </p>
          </div>
        ) : (() => {
          const paginatedAccounts = accounts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
          return (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Account Holder</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Bank</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Account No.</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Branch</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Balance</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {paginatedAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{account.fullName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-300">{account.bankName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-300 font-mono">{account.accountNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            {account.branch.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-semibold text-white">
                            ₹{account.bankBalance.toLocaleString('en-IN')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[account.status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                            {statusLabels[account.status] ?? account.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={accounts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paginatedAccounts.map((account) => (
                <div key={account.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{account.fullName}</p>
                      <p className="text-xs text-slate-400">{account.bankName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusColors[account.status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      {statusLabels[account.status] ?? account.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Account No.</p>
                      <p className="text-slate-300 font-mono">{account.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Balance</p>
                      <p className="text-white font-semibold">₹{account.bankBalance.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Branch</p>
                      <p className="text-slate-300 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {account.branch.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination
                currentPage={currentPage}
                totalItems={accounts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
          );
        })()
        )}
      </div>
    </Sidebar>
  );
}
