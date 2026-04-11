'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Landmark,
  IndianRupee,
  X,
  Pencil,
  Trash2,
  Shield,
  Wallet,
  Globe,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Send,
  ListFilter,
  RefreshCw,
  Download,
  FileText,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

type AccountStatus = 'ACTIVE' | 'DEBIT_FREEZE' | 'CREDIT_FREEZE' | 'CYBER' | 'CLOSED';

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
  status: AccountStatus;
  branchId?: string;
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

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'OUT_TRANSFER';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  fromAccountId: string;
  toAccountId: string | null;
  fromAccount: { id: string; fullName: string; accountNumber: string; bankName: string };
  toAccount: { id: string; fullName: string; accountNumber: string; bankName: string } | null;
  createdBy: { id: string; fullName: string; username: string };
  createdAt: string;
}

interface AllBranch {
  id: string;
  name: string;
  bankAccounts: { id: string; fullName: string; accountNumber: string }[];
}

type TxType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'OUT_TRANSFER';
type TabType = 'accounts' | 'transactions' | 'daily-report';

interface DailyReport {
  id: string;
  date: string;
  totalDeposit: number;
  totalWithdrawal: number;
  playerBalance: number;
  profitLoss: number;
  createdBy: { id: string; fullName: string; username: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  DEBIT_FREEZE: { label: 'Debit Freeze', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  CREDIT_FREEZE: { label: 'Credit Freeze', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  CYBER: { label: 'Cyber', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  CLOSED: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30' },
};

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
  const [editForm, setEditForm] = useState<Partial<BankAccount>>({});

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getToken = () => localStorage.getItem('accessToken');

  const fetchBranch = useCallback(async () => {
    const token = getToken();
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
  }, [apiUrl, branchId, router]);

  const fetchTransactions = useCallback(async (accountId: string) => {
    const token = getToken();
    if (!token) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${apiUrl}/transactions/account/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch {
      // silently fail
    } finally {
      setTxLoading(false);
    }
  }, [apiUrl]);

  const fetchBranchTransactions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setBranchTxLoading(true);
    try {
      const res = await fetch(`${apiUrl}/transactions/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranchTransactions(data);
      }
    } catch {
      // silently fail
    } finally {
      setBranchTxLoading(false);
    }
  }, [apiUrl, branchId]);

  const fetchAllBranches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllBranches(data);
      }
    } catch {
      // silently fail
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  const fetchDailyReports = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setDailyReportsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/daily-reports/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDailyReports(data);
      }
    } catch {
      // silently fail
    } finally {
      setDailyReportsLoading(false);
    }
  }, [apiUrl, branchId]);

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

  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '****' + num.slice(-4);
  };

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
      const res = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        closeTxModal();
        await fetchBranch();
        if (popupMode === 'view' && selectedAccount) {
          fetchTransactions(selectedAccount.id);
        }
        // Refresh branch transactions if on that tab
        if (activeTab === 'transactions') {
          fetchBranchTransactions();
        }
      } else {
        const errData = await res.json();
        setTxError(errData.message || 'Transaction failed');
      }
    } catch {
      setTxError('Transaction failed');
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    const token = getToken();
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
    const token = getToken();
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

  const txTypeLabel = (type: TxType) => {
    switch (type) {
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'TRANSFER': return 'Internal Transfer';
      case 'OUT_TRANSFER': return 'Out Transfer';
    }
  };

  const txTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-400';
      case 'WITHDRAWAL': return 'text-red-400';
      case 'TRANSFER': return 'text-blue-400';
      case 'OUT_TRANSFER': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const txTypeBadge = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WITHDRAWAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'TRANSFER': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'OUT_TRANSFER': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const txTypeShort = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'D';
      case 'WITHDRAWAL': return 'W';
      case 'TRANSFER': return 'T';
      case 'OUT_TRANSFER': return 'OT';
      default: return '?';
    }
  };

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
        const res = await fetch(`${apiUrl}/daily-reports/${editingReportId}`, {
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
        const res = await fetch(`${apiUrl}/daily-reports`, {
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

  const handleDeleteReport = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setDeletingReportId(id);
    try {
      const res = await fetch(`${apiUrl}/daily-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchDailyReports();
      }
    } catch {
      // silently fail
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleStatusChange = async (account: BankAccount, newStatus: AccountStatus) => {
    const token = getToken();
    if (!token) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`${apiUrl}/bank-accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchBranch();
      }
    } catch {
      // silently fail
    } finally {
      setStatusChanging(false);
      setStatusDropdownAccountId(null);
    }
  };

  const filterByDate = (txList: Transaction[], dateFrom: string, dateTo: string) => {
    return txList.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (txDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) return false;
      }
      return true;
    });
  };

  const filteredBranchTx = filterByDate(branchTransactions, branchTxDateFrom, branchTxDateTo);
  const filteredAcctTx = filterByDate(transactions, acctTxDateFrom, acctTxDateTo);

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

  // Compute balance summary by status
  const getBalanceSummary = () => {
    if (!branch) return [];
    const summary: Record<string, { count: number; total: number }> = {};
    for (const acc of branch.bankAccounts) {
      if (!summary[acc.status]) {
        summary[acc.status] = { count: 0, total: 0 };
      }
      summary[acc.status].count++;
      summary[acc.status].total += acc.bankBalance;
    }
    return Object.entries(summary).map(([status, data]) => ({
      status: status as AccountStatus,
      ...data,
    }));
  };

  const totalBalance = branch?.bankAccounts.reduce((sum, a) => sum + a.bankBalance, 0) || 0;

  const DetailRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-200">{value ?? '—'}</span>
    </div>
  );

  const StatusBadge = ({ status }: { status: AccountStatus }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const TransactionTable = ({ txList, contextAccountId }: { txList: Transaction[]; contextAccountId?: string }) => (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Total */}
                  <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
                    <p className="text-lg font-bold text-white">₹{totalBalance.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400 mt-1">{branch.bankAccounts.length} accounts</p>
                  </div>
                  {/* Per status */}
                  {getBalanceSummary().map(({ status, count, total }) => {
                    const config = STATUS_CONFIG[status];
                    return (
                      <div key={status} className={`rounded-xl ${config.bg} border ${config.border} p-4`}>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${config.color}`}>{config.label}</p>
                        <p className={`text-lg font-bold ${config.color}`}>₹{total.toLocaleString('en-IN')}</p>
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
              <>
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
                          {branch.bankAccounts.map((account, idx) => (
                            <tr
                              key={account.id}
                              className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                                idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'
                              }`}
                              onClick={() => openViewPopup(account)}
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
                                          onClick={() => handleStatusChange(account, s)}
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
                                    onClick={(e) => { e.stopPropagation(); openTxModal(account, 'DEPOSIT'); }}
                                    className="px-1.5 py-1 rounded text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors"
                                    title="Deposit"
                                  >D</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openTxModal(account, 'WITHDRAWAL'); }}
                                    className="px-1.5 py-1 rounded text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                                    title="Withdrawal"
                                  >W</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openTxModal(account, 'TRANSFER'); }}
                                    className="px-1.5 py-1 rounded text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                                    title="Internal Transfer"
                                  >T</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openTxModal(account, 'OUT_TRANSFER'); }}
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
                )}
              </>
            )}

            {/* ===== TRANSACTIONS TAB ===== */}
            {activeTab === 'transactions' && (
              <div>
                {branchTxLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : branchTransactions.length === 0 ? (
                  <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <ListFilter className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-slate-500">
                      Transactions will appear here when you make deposits, withdrawals, or transfers
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">From:</label>
                        <input
                          type="date"
                          value={branchTxDateFrom}
                          onChange={(e) => setBranchTxDateFrom(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">To:</label>
                        <input
                          type="date"
                          value={branchTxDateTo}
                          onChange={(e) => setBranchTxDateTo(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {(branchTxDateFrom || branchTxDateTo) && (
                        <button
                          onClick={() => { setBranchTxDateFrom(''); setBranchTxDateTo(''); }}
                          className="text-xs text-slate-400 hover:text-white transition-colors underline"
                        >
                          Clear
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-slate-500">{filteredBranchTx.length} transactions</span>
                        <button
                          onClick={() => downloadTransactionsCSV(filteredBranchTx, `${branch.name.replace(/\s+/g, '_')}_Transactions`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download CSV
                        </button>
                      </div>
                    </div>
                    {filteredBranchTx.length === 0 ? (
                      <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-700/50">
                        <p className="text-slate-500 text-sm">No transactions found for the selected date range</p>
                      </div>
                    ) : (
                      <TransactionTable txList={filteredBranchTx} />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== DAILY REPORT TAB ===== */}
            {activeTab === 'daily-report' && (
              <div>
                {/* Create / Edit Form */}
                {showReportForm ? (
                  <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {editingReportId ? 'Edit Daily Report' : 'Create Daily Report'}
                    </h3>
                    {reportError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {reportError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Date</label>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          disabled={!!editingReportId}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Total Deposit</label>
                        <input
                          type="number"
                          value={reportDeposit}
                          onChange={(e) => setReportDeposit(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Total Withdrawal</label>
                        <input
                          type="number"
                          value={reportWithdrawal}
                          onChange={(e) => setReportWithdrawal(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Player Balance</label>
                        <input
                          type="number"
                          value={reportPlayerBalance}
                          onChange={(e) => setReportPlayerBalance(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    {/* Live P/L Preview */}
                    {reportDeposit && reportWithdrawal && (
                      <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">P/L Preview: </span>
                        <span className={`text-sm font-bold ${(parseFloat(reportDeposit) || 0) - (parseFloat(reportWithdrawal) || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ₹{((parseFloat(reportDeposit) || 0) - (parseFloat(reportWithdrawal) || 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">(Deposit - Withdrawal)</span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleReportSubmit}
                        disabled={reportSubmitting}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {reportSubmitting ? 'Saving...' : editingReportId ? 'Update Report' : 'Create Report'}
                      </button>
                      <button
                        onClick={() => { setShowReportForm(false); setEditingReportId(null); setReportError(''); setReportDeposit(''); setReportWithdrawal(''); setReportPlayerBalance(''); }}
                        className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => { setShowReportForm(true); setEditingReportId(null); setReportDate(new Date().toISOString().split('T')[0]); setReportDeposit(''); setReportWithdrawal(''); setReportPlayerBalance(''); setReportError(''); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Create Daily Report
                    </button>
                  </div>
                )}

                {/* Reports Table */}
                {dailyReportsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : dailyReports.length === 0 ? (
                  <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No daily reports yet</h3>
                    <p className="text-slate-500">Click &quot;Create Daily Report&quot; to add your first report</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-800/80 border-b border-slate-600/50">
                            <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Date</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Total Deposit</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Total Withdrawal</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Player Balance</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">P/L</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider border-r border-slate-700/40">Created By</th>
                            <th className="text-center px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyReports.map((report, idx) => (
                            <tr
                              key={report.id}
                              className={`border-b border-slate-700/30 ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'} hover:bg-slate-700/30 transition-colors`}
                            >
                              <td className="px-4 py-3 text-slate-200 border-r border-slate-700/30 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                  {new Date(report.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-green-400 font-medium border-r border-slate-700/30">
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  ₹{report.totalDeposit.toLocaleString('en-IN')}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-red-400 font-medium border-r border-slate-700/30">
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  ₹{report.totalWithdrawal.toLocaleString('en-IN')}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-blue-400 font-medium border-r border-slate-700/30">
                                ₹{report.playerBalance.toLocaleString('en-IN')}
                              </td>
                              <td className={`px-4 py-3 text-right font-bold border-r border-slate-700/30 ${report.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {report.profitLoss >= 0 ? '+' : ''}₹{report.profitLoss.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs border-r border-slate-700/30">
                                {report.createdBy.fullName}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditReport(report)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReport(report.id)}
                                    disabled={deletingReportId === report.id}
                                    className="px-2 py-1 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                  >
                                    {deletingReportId === report.id ? '...' : 'Del'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {/* Summary row */}
                        <tfoot>
                          <tr className="bg-slate-800/60 border-t-2 border-slate-600/50">
                            <td className="px-4 py-3 text-slate-300 font-bold border-r border-slate-700/30">TOTAL</td>
                            <td className="px-4 py-3 text-right text-green-400 font-bold border-r border-slate-700/30">
                              ₹{dailyReports.reduce((sum, r) => sum + r.totalDeposit, 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right text-red-400 font-bold border-r border-slate-700/30">
                              ₹{dailyReports.reduce((sum, r) => sum + r.totalWithdrawal, 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-400 font-bold border-r border-slate-700/30">
                              ₹{dailyReports.reduce((sum, r) => sum + r.playerBalance, 0).toLocaleString('en-IN')}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold border-r border-slate-700/30 ${dailyReports.reduce((sum, r) => sum + r.profitLoss, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {dailyReports.reduce((sum, r) => sum + r.profitLoss, 0) >= 0 ? '+' : ''}₹{dailyReports.reduce((sum, r) => sum + r.profitLoss, 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-700/30"></td>
                            <td className="px-4 py-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== ACCOUNT DETAIL POPUP ===== */}
            {selectedAccount && popupMode && !txModalOpen && (
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {popupMode === 'view' ? selectedAccount.fullName : 'Edit Account'}
                          </h3>
                          {popupMode === 'view' && <StatusBadge status={selectedAccount.status} />}
                        </div>
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
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                            <StatusBadge status={selectedAccount.status} />
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

                      {/* Transaction History */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-yellow-400" />
                            <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Transaction History</h4>
                          </div>
                          {filteredAcctTx.length > 0 && (
                            <button
                              onClick={() => downloadTransactionsCSV(filteredAcctTx, `${selectedAccount.fullName.replace(/\s+/g, '_')}_Statement`, selectedAccount.id)}
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
                            <span className="text-xs text-slate-500 ml-auto">{filteredAcctTx.length} of {transactions.length}</span>
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
                        ) : filteredAcctTx.length === 0 ? (
                          <div className="text-center py-6 bg-slate-800/40 rounded-xl">
                            <p className="text-slate-500 text-sm">No transactions found for the selected date range</p>
                          </div>
                        ) : (
                          <TransactionTable txList={filteredAcctTx} contextAccountId={selectedAccount.id} />
                        )}
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
                          <div>
                            <Label className="text-slate-400 text-xs">Account Status</Label>
                            <select
                              value={editForm.status || 'ACTIVE'}
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

            {/* ===== TRANSACTION MODAL ===== */}
            {txModalOpen && selectedAccount && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeTxModal}>
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
                        {selectedAccount.fullName} &middot; Balance: ₹{selectedAccount.bankBalance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button onClick={closeTxModal} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
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
                          {getTransferTargetAccounts().map((a) => (
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
                              {getTransferTargetAccounts().map((a) => (
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
                      onClick={handleTransaction}
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
            )}
          </>
        ) : null}
      </div>
    </Sidebar>
  );
}
