'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  ArrowUpDown,
  IndianRupee,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface DashboardStats {
  overview: {
    totalBranches: number;
    totalAccounts: number;
    totalTransactions: number;
    totalBalance: number;
  };
  branchSummaries: {
    id: string;
    name: string;
    accountCount: number;
    totalBalance: number;
    dailyReports: { date: string; totalDeposit: number; totalWithdrawal: number; profitLoss: number }[];
  }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    fromAccount: { fullName: string; accountNumber: string };
    toAccount: { fullName: string } | null;
    createdAt: string;
  }[];
  txVolumeByType: { type: string; count: number; totalAmount: number }[];
  topAccounts: {
    id: string;
    fullName: string;
    bankName: string;
    bankBalance: number;
    status: string;
    branch: { name: string };
  }[];
  statusSummary: { status: string; count: number; totalBalance: number }[];
  plTrend: { date: string; branch: string; totalDeposit: number; totalWithdrawal: number; profitLoss: number }[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  DEBIT_FREEZE: '#eab308',
  CREDIT_FREEZE: '#f97316',
  CYBER: '#ef4444',
  CLOSED: '#64748b',
};

const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  TRANSFER: 'Transfer',
  OUT_TRANSFER: 'Out Transfer',
  IN_TRANSFER: 'In Transfer',
};

const TX_TYPE_COLORS: Record<string, string> = {
  DEPOSIT: '#22c55e',
  WITHDRAWAL: '#ef4444',
  TRANSFER: '#3b82f6',
  OUT_TRANSFER: '#f97316',
  IN_TRANSFER: '#14b8a6',
};

const formatINR = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => { showToast('Failed to load dashboard data', 'error'); })
      .finally(() => setLoading(false));
    fetch(`${API}/api/auth/telegram/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setTelegramLinked(d.linked))
      .catch(() => { /* Telegram status is optional */ });
  }, []);

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Sidebar>
    );
  }

  if (!stats) {
    return (
      <Sidebar>
        <div className="text-slate-400 text-center py-20">Failed to load dashboard data</div>
      </Sidebar>
    );
  }

  const { overview, branchSummaries, recentTransactions, txVolumeByType, topAccounts, statusSummary } = stats;

  // Prepare chart data
  const branchBalanceData = branchSummaries.map((b) => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
    balance: b.totalBalance,
    accounts: b.accountCount,
  }));

  const statusPieData = statusSummary
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.status.replace('_', ' '),
      value: s.count,
      color: STATUS_COLORS[s.status] || '#64748b',
    }));

  const txTypeData = txVolumeByType.map((t) => ({
    name: TX_TYPE_LABELS[t.type] || t.type,
    count: t.count,
    amount: t.totalAmount,
    color: TX_TYPE_COLORS[t.type] || '#64748b',
  }));

  // Aggregate P/L trend by date
  const plByDate = new Map<string, { deposit: number; withdrawal: number; pl: number }>();
  for (const r of stats.plTrend) {
    const d = new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const existing = plByDate.get(d) || { deposit: 0, withdrawal: 0, pl: 0 };
    existing.deposit += r.totalDeposit;
    existing.withdrawal += r.totalWithdrawal;
    existing.pl += r.profitLoss;
    plByDate.set(d, existing);
  }
  const plTrendData = Array.from(plByDate.entries())
    .map(([date, data]) => ({ date, ...data }))
    .reverse();

  return (
    <Sidebar>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <LayoutDashboard className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
          <KPICard icon={Building2} label="Branches" value={overview.totalBranches} color="blue" />
          <KPICard icon={Users} label="Accounts" value={overview.totalAccounts} color="green" />
          <KPICard icon={ArrowUpDown} label="Transactions" value={overview.totalTransactions} color="purple" />
          <KPICard icon={IndianRupee} label="Total Balance" value={formatINR(overview.totalBalance)} color="orange" />
        </div>

        {/* Telegram 2FA Banner */}
        {telegramLinked !== null && !telegramLinked && (
          <Link href="/profile" className="block mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 hover:bg-amber-500/15 transition-colors">
            <div className="flex items-center gap-3">
              <ShieldOff className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                <span className="font-medium">Telegram 2FA is not set up.</span>{' '}
                <span className="text-amber-400/80">Go to Profile & Settings to enable it.</span>
              </p>
            </div>
          </Link>
        )}
        {telegramLinked && (
          <div className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 p-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">
                <span className="font-medium">Telegram 2FA is active.</span>{' '}
                <Link href="/profile" className="text-green-400/80 underline hover:text-green-300">Manage in Profile</Link>
              </p>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          {/* Branch Balances */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">Branch Balances</h3>
            <div className="h-56 md:h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchBalanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatINR(Number(value)), 'Balance']}
                  />
                  <Bar dataKey="balance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Account Status Pie */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">Account Status Distribution</h3>
            <div className="h-56 md:h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          {/* P/L Trend */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">P/L Trend</h3>
            <div className="h-56 md:h-64 min-w-0">
              {plTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={plTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [formatINR(Number(value)), name === 'deposit' ? 'Deposit' : name === 'withdrawal' ? 'Withdrawal' : 'P/L']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="deposit" stroke="#22c55e" name="Deposit" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="withdrawal" stroke="#ef4444" name="Withdrawal" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pl" stroke="#3b82f6" name="P/L" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No P/L data yet. Create daily reports to see trends.
                </div>
              )}
            </div>
          </div>

          {/* Transaction Volume */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">Transaction Volume (7 days)</h3>
            <div className="h-56 md:h-64 min-w-0">
              {txTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={txTypeData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [name === 'amount' ? formatINR(Number(value)) : value, name === 'amount' ? 'Amount' : 'Count']}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No transactions in the last 7 days.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Accounts & Recent Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Top Accounts */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">Top Accounts by Balance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2 pr-2">Name</th>
                    <th className="text-left py-2 pr-2">Branch</th>
                    <th className="text-right py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {topAccounts.map((a, i) => (
                    <tr key={a.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="py-1.5 pr-2 text-slate-500">{i + 1}</td>
                      <td className="py-1.5 pr-2 text-white">{a.fullName}</td>
                      <td className="py-1.5 pr-2 text-slate-400">{a.branch.name}</td>
                      <td className="py-1.5 text-right font-mono text-green-400">{formatINR(Number(a.bankBalance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    tx.type === 'DEPOSIT' ? 'bg-green-500/15 text-green-400' :
                    tx.type === 'WITHDRAWAL' ? 'bg-red-500/15 text-red-400' :
                    tx.type === 'TRANSFER' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>
                    {tx.type === 'DEPOSIT' ? <TrendingUp className="w-4 h-4" /> :
                     tx.type === 'WITHDRAWAL' ? <TrendingDown className="w-4 h-4" /> :
                     <ArrowUpDown className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{tx.fromAccount.fullName}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${
                    tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{formatINR(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  const iconBg = {
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-green-500/15 text-green-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3 md:p-4 min-w-0">
      <div className="flex items-center gap-2 md:gap-3 mb-2">
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${iconBg[color]}`}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>
      <p className="text-[10px] md:text-xs text-slate-400 mb-0.5 md:mb-1">{label}</p>
      <p className="text-base md:text-xl font-bold text-white truncate">{value}</p>
      <div className={`h-1 w-10 md:w-12 rounded-full bg-gradient-to-r ${colorMap[color]} mt-1.5 md:mt-2`} />
    </div>
  );
}
