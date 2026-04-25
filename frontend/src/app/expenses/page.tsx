'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  Trash2,
  Pencil,
  X,
  IndianRupee,
  Building2,
  CreditCard,
  Calendar,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Download,
  ChevronDown,
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import { handleEnterKeyNavigation } from '@/lib/form-utils';
import { showToast } from '@/components/ui/toast';
import { downloadPDF, downloadExcel, formatExpenseRows } from '@/lib/download-utils';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface AccountItem {
  id: string;
  fullName: string;
  accountNumber: string;
  bankName: string;
  bankBalance: number;
  branchId: string;
}

interface BranchItem {
  id: string;
  name: string;
  code: string;
  bankAccounts?: AccountItem[];
}

interface ExpenseItem {
  id: string;
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  account: {
    id: string;
    fullName: string;
    accountNumber: string;
    bankName: string;
  };
  branch: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filter state
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Form state
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Accounts for selected branch in the form
  const [branchAccounts, setBranchAccounts] = useState<AccountItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Download menu
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Esc key handler for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirmId) setDeleteConfirmId(null);
        else if (editingExpense) setEditingExpense(null);
        else if (showModal) setShowModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showModal, deleteConfirmId, editingExpense]);

  const getToken = () => localStorage.getItem('accessToken') ?? '';

  const fetchExpenses = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    try {
      const params = new URLSearchParams();
      if (filterBranchId) params.set('branchId', filterBranchId);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      const url = filterBranchId
        ? `${API}/api/expenses/branch/${filterBranchId}?${params}`
        : `${API}/api/expenses?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data);
    } catch {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, filterBranchId, filterDateFrom, filterDateTo]);

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

  const fetchBranchAccounts = useCallback(async (branchId: string) => {
    if (!branchId) { setBranchAccounts([]); return; }
    const token = getToken();
    if (!token) return;
    setAccountsLoading(true);
    try {
      const res = await fetch(`${API}/api/branches/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const accounts = (data.bankAccounts || [])
        .filter((a: AccountItem & { status: string }) => a.status === 'ACTIVE')
        .map((a: AccountItem & { bankBalance: number | string }) => ({
          ...a,
          bankBalance: Number(a.bankBalance),
        }));
      setBranchAccounts(accounts);
    } catch {
      setBranchAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchBranches();
  }, [fetchExpenses, fetchBranches]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchAccounts(selectedBranchId);
      setSelectedAccountId('');
    } else {
      setBranchAccounts([]);
      setSelectedAccountId('');
    }
  }, [selectedBranchId, fetchBranchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    if (!selectedAccountId) {
      showToast('Please select an account', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please enter a reason for the expense', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          amount: Number(amount),
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to create expense' }));
        throw new Error(err.message || 'Failed to create expense');
      }

      showToast(`Expense of ₹${Number(amount).toLocaleString('en-IN')} recorded successfully`, 'success');
      setShowModal(false);
      setSelectedBranchId('');
      setSelectedAccountId('');
      setAmount('');
      setReason('');
      fetchExpenses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create expense';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Expense deleted and balance restored', 'success');
      setDeleteConfirmId(null);
      fetchExpenses();
    } catch {
      showToast('Failed to delete expense', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEditExpense = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setEditAmount(String(exp.amount));
    setEditReason(exp.reason);
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    const token = getToken();
    if (!token) return;
    if (!editAmount || Number(editAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!editReason.trim()) {
      showToast('Please enter a reason', 'error');
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch(`${API}/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(editAmount),
          reason: editReason.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to update expense' }));
        throw new Error(err.message || 'Failed to update expense');
      }
      showToast('Expense updated successfully', 'success');
      setEditingExpense(null);
      fetchExpenses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update expense';
      showToast(msg, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Server-side date filtering applied via fetchExpenses
  const filteredExpenses = expenses;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const selectedAccount = branchAccounts.find((a) => a.id === selectedAccountId);

  return (
    <Sidebar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Expenses</h1>
              <p className="text-sm text-slate-400">Track and manage expenses from bank accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Expenses</p>
                <p className="text-lg font-semibold text-rose-400">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Records</p>
                <p className="text-lg font-semibold text-white">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Branches</p>
                <p className="text-lg font-semibold text-white">
                  {new Set(filteredExpenses.map((e) => e.branch.id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-rose-500/50"
                placeholder="From"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-rose-500/50"
                placeholder="To"
              />
            </div>
            {(filterBranchId || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterBranchId('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
              >
                Clear Filters
              </button>
            )}
            {filteredExpenses.length > 0 && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showDownloadMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                    <div className="absolute right-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 w-44">
                      <button
                        onClick={() => {
                          const { headers, rows, summaryRow } = formatExpenseRows(filteredExpenses);
                          const branchLabel = filterBranchId
                            ? branches.find((b) => b.id === filterBranchId)?.name || 'Filtered'
                            : 'All_Branches';
                          downloadPDF({
                            title: `Expenses — ${branchLabel.replace(/_/g, ' ')}`,
                            filename: `Expenses_${branchLabel.replace(/\s+/g, '_')}`,
                            headers,
                            rows,
                            summaryRow,
                            dateRange: { from: filterDateFrom, to: filterDateTo },
                          });
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <FileText className="h-4 w-4 text-red-400" />
                        Download PDF
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows, summaryRow } = formatExpenseRows(filteredExpenses);
                          const branchLabel = filterBranchId
                            ? branches.find((b) => b.id === filterBranchId)?.name || 'Filtered'
                            : 'All_Branches';
                          downloadExcel({
                            title: `Expenses — ${branchLabel.replace(/_/g, ' ')}`,
                            filename: `Expenses_${branchLabel.replace(/\s+/g, '_')}`,
                            headers,
                            rows,
                            summaryRow,
                            dateRange: { from: filterDateFrom, to: filterDateTo },
                          });
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-400" />
                        Download Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">No expenses yet</p>
              <p className="text-sm mt-1">Click &quot;Add Expense&quot; to record your first expense</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Branch</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Account</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Reason</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Balance Before</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Balance After</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">By</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {new Date(exp.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-xs text-slate-500">
                          {new Date(exp.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-300">{exp.branch.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-300">{exp.account.fullName}</div>
                        <div className="text-xs text-slate-500">{exp.account.bankName} - {exp.account.accountNumber}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-slate-300 truncate block">{exp.reason}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-rose-400 font-semibold">
                          -₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-slate-400">
                        ₹{exp.balanceBefore.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-slate-400">
                        ₹{exp.balanceAfter.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                        {exp.createdBy.fullName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete expense (restores balance)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t border-slate-600/50 bg-slate-800/80">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-white">
                      TOTAL ({filteredExpenses.length} expenses)
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-rose-400 font-bold">
                        -₹{totalExpenses.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Add Expense</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4" onKeyDown={handleEnterKeyNavigation}>
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Building2 className="h-3.5 w-3.5 inline mr-1.5" />
                  Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 text-sm"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <CreditCard className="h-3.5 w-3.5 inline mr-1.5" />
                  Account
                </label>
                {accountsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500" />
                    Loading accounts...
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 text-sm"
                    required
                    disabled={!selectedBranchId}
                  >
                    <option value="">
                      {selectedBranchId ? 'Select Account' : 'Select a branch first'}
                    </option>
                    {branchAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} - {a.bankName} ({a.accountNumber}) | ₹{a.bankBalance.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                )}
                {selectedAccount && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Available balance: <span className="text-green-400 font-medium">₹{selectedAccount.bankBalance.toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <IndianRupee className="h-3.5 w-3.5 inline mr-1.5" />
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 text-sm"
                  placeholder="Enter expense amount"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                />
                {selectedAccount && amount && Number(amount) > selectedAccount.bankBalance && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 text-sm resize-none"
                  placeholder="Enter the reason for this expense"
                  rows={3}
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedAccountId || !amount || !reason.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" />
                      Record Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Expense</h3>
                <p className="text-sm text-slate-400">
                  This will restore ₹{expenses.find((e) => e.id === deleteConfirmId)?.amount.toLocaleString('en-IN')} back to the account. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Pencil className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Edit Expense</h2>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4" onKeyDown={handleEnterKeyNavigation}>
              <div className="text-sm text-slate-400">
                <p>Account: <span className="text-white">{editingExpense.account.fullName}</span> ({editingExpense.account.bankName})</p>
                <p>Branch: <span className="text-white">{editingExpense.branch.name}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                  min="0.01"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Reason</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditExpense}
                  disabled={editSubmitting || !editAmount || !editReason.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
