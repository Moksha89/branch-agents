'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  ArrowLeft,
  Landmark,
  ListFilter,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/toast';

import {
  BankAccount,
  Branch,
  Transaction,
  AllBranch,
  DailyReport,
  TxType,
  TabType,
  AccountStatus,
  STATUS_CONFIG,
  filterByDate,
} from './components/types';
import AccountsTab from './components/AccountsTab';
import TransactionsTab from './components/TransactionsTab';
import DailyReportsTab from './components/DailyReportsTab';
import AccountDetailPopup from './components/AccountDetailPopup';
import TransactionModal from './components/TransactionModal';

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  // Popup state
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [popupMode, setPopupMode] = useState<'view' | 'edit' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Record<string, string | number | undefined>>({});

  // Transaction state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<TxType>('DEPOSIT');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txToAccountId, setTxToAccountId] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Branch-level transactions
  const [branchTransactions, setBranchTransactions] = useState<Transaction[]>([]);
  const [branchTxLoading, setBranchTxLoading] = useState(false);

  // Status change dropdown
  const [statusDropdownAccountId, setStatusDropdownAccountId] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  // Toast/notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search filter for accounts
  const [accountSearch, setAccountSearch] = useState('');

  // Loading states for PNG/CSV download
  const [downloadingPNG, setDownloadingPNG] = useState<string | null>(null);

  // Delete report confirmation
  const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);

  // Date filters
  const [branchTxDateFrom, setBranchTxDateFrom] = useState('');
  const [branchTxDateTo, setBranchTxDateTo] = useState('');
  const [acctTxDateFrom, setAcctTxDateFrom] = useState('');
  const [acctTxDateTo, setAcctTxDateTo] = useState('');

  // Daily reports
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [dailyReportsLoading, setDailyReportsLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDeposit, setReportDeposit] = useState('');
  const [reportWithdrawal, setReportWithdrawal] = useState('');
  const [reportPlayerBalance, setReportPlayerBalance] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  // For transfer: all branches + accounts
  const [allBranches, setAllBranches] = useState<AllBranch[]>([]);
  const [txTargetBranchId, setTxTargetBranchId] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  const getToken = () => localStorage.getItem('accessToken');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBranch = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`${API}/api/branches/${branchId}`, {
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
      // Convert Prisma Decimal bankBalance strings to numbers
      if (data.bankAccounts) {
        data.bankAccounts = data.bankAccounts.map((a: BankAccount) => ({
          ...a,
          bankBalance: Number(a.bankBalance),
        }));
      }
      setBranch(data);
    } catch {
      setError('Failed to load branch');
    } finally {
      setLoading(false);
    }
  }, [API, branchId, router]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    const token = getToken();
    if (!token) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/account/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const raw = json.data || json;
        // Convert Prisma Decimal strings to numbers
        const normalized = (raw as Transaction[]).map((tx: Transaction) => ({
          ...tx,
          amount: Number(tx.amount),
          balanceBefore: Number(tx.balanceBefore),
          balanceAfter: Number(tx.balanceAfter),
        }));
        setTransactions(normalized);
      }
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setTxLoading(false);
    }
  }, [API]);

  const fetchBranchTransactions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setBranchTxLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const raw = json.data || json;
        // Convert Prisma Decimal strings to numbers
        const normalized = (raw as Transaction[]).map((tx: Transaction) => ({
          ...tx,
          amount: Number(tx.amount),
          balanceBefore: Number(tx.balanceBefore),
          balanceAfter: Number(tx.balanceAfter),
        }));
        setBranchTransactions(normalized);
      }
    } catch {
      showToast('Failed to load branch transactions', 'error');
    } finally {
      setBranchTxLoading(false);
    }
  }, [API, branchId]);

  const fetchAllBranches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllBranches(data);
      }
    } catch {
      showToast('Failed to load branches', 'error');
    }
  }, [API]);

  useEffect(() => {
    fetchBranch();
    fetchAllBranches();
  }, [fetchBranch, fetchAllBranches]);

  const fetchDailyReports = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setDailyReportsLoading(true);
    try {
      const res = await fetch(`${API}/api/daily-reports/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Convert Prisma Decimal strings to numbers
        const normalized = (data as DailyReport[]).map((r: DailyReport) => ({
          ...r,
          totalDeposit: Number(r.totalDeposit),
          totalWithdrawal: Number(r.totalWithdrawal),
          playerBalance: Number(r.playerBalance),
          profitLoss: Number(r.profitLoss),
        }));
        setDailyReports(normalized);
      }
    } catch {
      showToast('Failed to load daily reports', 'error');
    } finally {
      setDailyReportsLoading(false);
    }
  }, [API, branchId]);

  // Load branch transactions when switching to transactions tab
  useEffect(() => {
    if (activeTab === 'transactions' && branchTransactions.length === 0) {
      fetchBranchTransactions();
    }
  }, [activeTab, branchTransactions.length, fetchBranchTransactions]);

  // Load daily reports when switching to daily-report tab
  useEffect(() => {
    if (activeTab === 'daily-report' && dailyReports.length === 0) {
      fetchDailyReports();
    }
  }, [activeTab, dailyReports.length, fetchDailyReports]);

  // ===== Popup handlers =====

  const openViewPopup = (account: BankAccount) => {
    setSelectedAccount(account);
    setPopupMode('view');
    setShowDeleteConfirm(false);
    setAcctTxDateFrom('');
    setAcctTxDateTo('');
    fetchTransactions(account.id);
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
      status: account.status,
    });
    setPopupMode('edit');
    setShowDeleteConfirm(false);
  };

  const closePopup = () => {
    setSelectedAccount(null);
    setPopupMode(null);
    setShowDeleteConfirm(false);
    setEditForm({});
    setTransactions([]);
  };

  // ===== Transaction modal handlers =====

  const openTxModal = (account: BankAccount, type: TxType) => {
    setSelectedAccount(account);
    setTxType(type);
    setTxAmount('');
    setTxDescription('');
    setTxToAccountId('');
    setTxTargetBranchId('');
    setTxError('');
    setTxModalOpen(true);
    if (type === 'TRANSFER' || type === 'OUT_TRANSFER') {
      fetchAllBranches();
    }
  };

  const closeTxModal = () => {
    setTxModalOpen(false);
    setTxError('');
  };

  const handleTransaction = async () => {
    if (!selectedAccount) return;
    const token = getToken();
    if (!token) return;
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) {
      setTxError('Please enter a valid amount');
      return;
    }
    if ((txType === 'TRANSFER' || txType === 'OUT_TRANSFER') && !txToAccountId) {
      setTxError('Please select a destination account');
      return;
    }

    setTxSubmitting(true);
    setTxError('');
    try {
      const body: Record<string, unknown> = {
        type: txType,
        amount,
        fromAccountId: selectedAccount.id,
        description: txDescription || undefined,
      };
      if (txToAccountId) {
        body.toAccountId = txToAccountId;
      }
      const res = await fetch(`${API}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        closeTxModal();
        showToast(`${txType.replace('_', ' ')} of ₹${amount.toLocaleString('en-IN')} successful`, 'success');
        await fetchBranch();
        if (popupMode === 'view' && selectedAccount) {
          fetchTransactions(selectedAccount.id);
        }
        if (activeTab === 'transactions') {
          fetchBranchTransactions();
        }
      } else {
        const errData = await res.json();
        const msg = errData.message || 'Transaction failed';
        setTxError(msg);
        showToast(msg, 'error');
      }
    } catch {
      setTxError('Transaction failed');
      showToast('Transaction failed', 'error');
    } finally {
      setTxSubmitting(false);
    }
  };

  // ===== Account CRUD handlers =====

  const handleSave = async () => {
    if (!selectedAccount) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const { bankBalance, ...editData } = editForm;
      void bankBalance; // intentionally unused
      const res = await fetch(`${API}/api/bank-accounts/${selectedAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        closePopup();
        await fetchBranch();
        showToast('Account updated successfully');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update account', 'error');
      }
    } catch {
      showToast('Failed to update account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    const token = getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/bank-accounts/${selectedAccount.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        closePopup();
        await fetchBranch();
        showToast('Account deleted successfully');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to delete account', 'error');
      }
    } catch {
      showToast('Failed to delete account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTransferBranch = async (accountId: string, targetBranchId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/bank-accounts/${accountId}/transfer-branch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetBranchId }),
      });
      if (res.ok) {
        const data = await res.json();
        closePopup();
        await fetchBranch();
        showToast(`Account transferred from ${data.previousBranch} to ${data.newBranch}`);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to transfer account', 'error');
      }
    } catch {
      showToast('Failed to transfer account', 'error');
    }
  };

  const handleStatusChange = async (account: BankAccount, newStatus: AccountStatus) => {
    const token = getToken();
    if (!token) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`${API}/api/bank-accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchBranch();
        showToast('Status updated');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to change status', 'error');
      }
    } catch {
      showToast('Failed to change status', 'error');
    } finally {
      setStatusChanging(false);
      setStatusDropdownAccountId(null);
    }
  };

  // ===== CSV download =====

  const downloadTransactionsCSV = (txList: Transaction[], filename: string, contextAccountId?: string) => {
    const headers = ['Date', 'Type', 'From Account', 'To Account', 'Amount', 'Balance Before', 'Balance After', 'Description', 'Created By'];
    const rows = txList.map((tx) => {
      const date = new Date(tx.createdAt);
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const isCredit = contextAccountId
        ? tx.type === 'DEPOSIT' || (tx.toAccountId === contextAccountId && tx.fromAccountId !== contextAccountId)
        : tx.type === 'DEPOSIT';
      const typeLabel = tx.type === 'DEPOSIT' ? 'Deposit' : tx.type === 'WITHDRAWAL' ? 'Withdrawal' : tx.type === 'TRANSFER' ? 'Transfer' : 'Out Transfer';
      const amountStr = (isCredit ? '+' : '-') + tx.amount.toLocaleString('en-IN');
      return [
        dateStr,
        typeLabel,
        tx.fromAccount.fullName + ' (' + tx.fromAccount.accountNumber + ')',
        tx.toAccount ? tx.toAccount.fullName + ' (' + tx.toAccount.accountNumber + ')' : '-',
        amountStr,
        tx.balanceBefore.toLocaleString('en-IN'),
        tx.balanceAfter.toLocaleString('en-IN'),
        tx.description || '-',
        tx.createdBy.fullName,
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== Daily report handlers =====

  const handleReportSubmit = async () => {
    const token = getToken();
    if (!token) return;
    const deposit = parseFloat(reportDeposit);
    const withdrawal = parseFloat(reportWithdrawal);
    const playerBal = parseFloat(reportPlayerBalance);
    if (isNaN(deposit) || isNaN(withdrawal) || isNaN(playerBal)) {
      setReportError('Please fill all fields with valid numbers');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      if (editingReportId) {
        const res = await fetch(`${API}/api/daily-reports/${editingReportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ totalDeposit: deposit, totalWithdrawal: withdrawal, playerBalance: playerBal }),
        });
        if (!res.ok) {
          const err = await res.json();
          setReportError(err.message || 'Failed to update report');
          return;
        }
      } else {
        const res = await fetch(`${API}/api/daily-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date: reportDate, totalDeposit: deposit, totalWithdrawal: withdrawal, playerBalance: playerBal, branchId }),
        });
        if (!res.ok) {
          const err = await res.json();
          setReportError(err.message || 'Failed to create report');
          return;
        }
      }
      setShowReportForm(false);
      setEditingReportId(null);
      setReportDeposit('');
      setReportWithdrawal('');
      setReportPlayerBalance('');
      setReportError('');
      await fetchDailyReports();
    } catch {
      setReportError('Failed to save report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleEditReport = (report: DailyReport) => {
    setEditingReportId(report.id);
    setReportDate(report.date.split('T')[0]);
    setReportDeposit(String(report.totalDeposit));
    setReportWithdrawal(String(report.totalWithdrawal));
    setReportPlayerBalance(String(report.playerBalance));
    setReportError('');
    setShowReportForm(true);
  };

  const handleDownloadReportPNG = async (reportId: string, reportDate: string) => {
    const token = getToken();
    if (!token) return;
    setDownloadingPNG(reportId);
    try {
      const res = await fetch(`${API}/api/daily-reports/${reportId}/png`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-report-${branch?.name.replace(/\s+/g, '_') || 'branch'}-${reportDate.split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        showToast('Failed to download PNG report', 'error');
      }
    } catch {
      showToast('Failed to download PNG report', 'error');
    } finally {
      setDownloadingPNG(null);
    }
  };

  const handleDeleteReport = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setDeletingReportId(id);
    try {
      const res = await fetch(`${API}/api/daily-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchDailyReports();
        showToast('Report deleted');
        setConfirmDeleteReportId(null);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to delete report', 'error');
      }
    } catch {
      showToast('Failed to delete report', 'error');
    } finally {
      setDeletingReportId(null);
    }
  };

  const downloadDailyReportsCSV = () => {
    if (!dailyReports.length || !branch) return;
    const headers = ['Date', 'Total Deposit', 'Total Withdrawal', 'Player Balance', 'P/L', 'Created By'];
    const rows = dailyReports.map((r) => [
      new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      r.totalDeposit.toLocaleString('en-IN'),
      r.totalWithdrawal.toLocaleString('en-IN'),
      r.playerBalance.toLocaleString('en-IN'),
      (r.profitLoss >= 0 ? '+' : '') + r.profitLoss.toLocaleString('en-IN'),
      r.createdBy.fullName,
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${branch.name.replace(/\s+/g, '_')}_DailyReports.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== Computed values =====

  const filteredBranchTx = filterByDate(branchTransactions, branchTxDateFrom, branchTxDateTo);
  const filteredAcctTx = filterByDate(transactions, acctTxDateFrom, acctTxDateTo);

  const filteredAccounts = (branch?.bankAccounts || []).filter((account) => {
    if (!accountSearch) return true;
    const search = accountSearch.toLowerCase();
    return (
      account.fullName.toLowerCase().includes(search) ||
      account.bankName.toLowerCase().includes(search) ||
      account.accountNumber.toLowerCase().includes(search) ||
      account.mobileNumber.includes(search)
    );
  });

  const getTransferTargetAccounts = () => {
    if (txType === 'TRANSFER') {
      return (branch?.bankAccounts || []).filter((a) => a.id !== selectedAccount?.id);
    }
    if (txType === 'OUT_TRANSFER') {
      if (!txTargetBranchId) return [];
      const targetBranch = allBranches.find((b) => b.id === txTargetBranchId);
      return targetBranch?.bankAccounts || [];
    }
    return [];
  };

  const getBalanceSummary = () => {
    if (!branch) return [];
    const summary: Record<string, { count: number; total: number }> = {};
    for (const acc of branch.bankAccounts) {
      if (!summary[acc.status]) {
        summary[acc.status] = { count: 0, total: 0 };
      }
      summary[acc.status].count++;
      summary[acc.status].total += Number(acc.bankBalance);
    }
    return Object.entries(summary).map(([status, data]) => ({
      status: status as AccountStatus,
      ...data,
    }));
  };

  const totalBalance = branch?.bankAccounts.reduce((sum, a) => sum + Number(a.bankBalance), 0) || 0;

  return (
    <Sidebar>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
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

            <div className="flex items-center justify-between mb-6">
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

            {/* Balance Summary by Status */}
            {branch.bankAccounts.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 overflow-hidden">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
                    <p className="text-sm font-bold text-white truncate">₹{totalBalance.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400 mt-1">{branch.bankAccounts.length} accounts</p>
                  </div>
                  {getBalanceSummary().map(({ status, count, total }) => {
                    const config = STATUS_CONFIG[status];
                    return (
                      <div key={status} className={`rounded-xl ${config.bg} border ${config.border} p-4 overflow-hidden`}>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${config.color}`}>{config.label}</p>
                        <p className={`text-sm font-bold ${config.color} truncate`}>₹{total.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-400 mt-1">{count} account{count !== 1 ? 's' : ''}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-slate-800/30 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'accounts'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Landmark className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Accounts ({branch.bankAccounts.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ListFilter className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('daily-report')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'daily-report'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Daily Report
              </button>
            </div>

            {/* ===== ACCOUNTS TAB ===== */}
            {activeTab === 'accounts' && (
              <AccountsTab
                branchId={branch.id}
                accounts={branch.bankAccounts}
                filteredAccounts={filteredAccounts}
                accountSearch={accountSearch}
                setAccountSearch={setAccountSearch}
                statusDropdownAccountId={statusDropdownAccountId}
                setStatusDropdownAccountId={setStatusDropdownAccountId}
                statusChanging={statusChanging}
                onStatusChange={handleStatusChange}
                onAccountClick={openViewPopup}
                onTxOpen={openTxModal}
              />
            )}

            {/* ===== TRANSACTIONS TAB ===== */}
            {activeTab === 'transactions' && (
              <TransactionsTab
                loading={branchTxLoading}
                transactions={branchTransactions}
                filteredTransactions={filteredBranchTx}
                dateFrom={branchTxDateFrom}
                dateTo={branchTxDateTo}
                setDateFrom={setBranchTxDateFrom}
                setDateTo={setBranchTxDateTo}
                branchName={branch.name}
                onDownloadCSV={downloadTransactionsCSV}
              />
            )}

            {/* ===== DAILY REPORT TAB ===== */}
            {activeTab === 'daily-report' && (
              <DailyReportsTab
                loading={dailyReportsLoading}
                reports={dailyReports}
                showForm={showReportForm}
                editingReportId={editingReportId}
                reportDate={reportDate}
                reportDeposit={reportDeposit}
                reportWithdrawal={reportWithdrawal}
                reportPlayerBalance={reportPlayerBalance}
                reportSubmitting={reportSubmitting}
                reportError={reportError}
                downloadingPNG={downloadingPNG}
                confirmDeleteReportId={confirmDeleteReportId}
                deletingReportId={deletingReportId}
                setReportDate={setReportDate}
                setReportDeposit={setReportDeposit}
                setReportWithdrawal={setReportWithdrawal}
                setReportPlayerBalance={setReportPlayerBalance}
                setConfirmDeleteReportId={setConfirmDeleteReportId}
                onSubmit={handleReportSubmit}
                onCancel={() => { setShowReportForm(false); setEditingReportId(null); setReportError(''); setReportDeposit(''); setReportWithdrawal(''); setReportPlayerBalance(''); }}
                onCreateNew={() => { setShowReportForm(true); setEditingReportId(null); setReportDate(new Date().toISOString().split('T')[0]); setReportDeposit(''); setReportWithdrawal(''); setReportPlayerBalance(''); setReportError(''); }}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                onDownloadPNG={handleDownloadReportPNG}
                onDownloadCSV={downloadDailyReportsCSV}
              />
            )}

            {/* ===== ACCOUNT DETAIL POPUP ===== */}
            {selectedAccount && popupMode && !txModalOpen && (
              <AccountDetailPopup
                account={selectedAccount}
                popupMode={popupMode}
                editForm={editForm}
                setEditForm={setEditForm}
                saving={saving}
                deleting={deleting}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                transactions={transactions}
                filteredTransactions={filteredAcctTx}
                txLoading={txLoading}
                acctTxDateFrom={acctTxDateFrom}
                acctTxDateTo={acctTxDateTo}
                setAcctTxDateFrom={setAcctTxDateFrom}
                setAcctTxDateTo={setAcctTxDateTo}
                onEdit={openEditPopup}
                onSave={handleSave}
                onDelete={handleDelete}
                onClose={closePopup}
                onViewMode={openViewPopup}
                onDownloadCSV={downloadTransactionsCSV}
                allBranches={allBranches}
                onTransferBranch={handleTransferBranch}
              />
            )}

            {/* ===== TRANSACTION MODAL ===== */}
            {txModalOpen && selectedAccount && (
              <TransactionModal
                account={selectedAccount}
                txType={txType}
                txAmount={txAmount}
                txDescription={txDescription}
                txToAccountId={txToAccountId}
                txTargetBranchId={txTargetBranchId}
                txError={txError}
                txSubmitting={txSubmitting}
                branchId={branchId}
                allBranches={allBranches}
                transferTargetAccounts={getTransferTargetAccounts()}
                setTxAmount={setTxAmount}
                setTxDescription={setTxDescription}
                setTxToAccountId={setTxToAccountId}
                setTxTargetBranchId={setTxTargetBranchId}
                onSubmit={handleTransaction}
                onClose={closeTxModal}
              />
            )}
          </>
        ) : null}
      </div>
    </Sidebar>
  );
}
