'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { GitCompare } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface BranchComparison {
  id: string;
  name: string;
  accountCount: number;
  totalBalance: number;
  statusBreakdown: Record<string, { count: number; balance: number }>;
  totalDeposit: number;
  totalWithdrawal: number;
  totalPL: number;
}

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DEBIT_FREEZE: 'Debit Freeze',
  CREDIT_FREEZE: 'Credit Freeze',
  CYBER: 'Cyber',
  CLOSED: 'Closed',
};

export default function BranchComparePage() {
  const [branches, setBranches] = useState<BranchComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API}/api/branches/compare/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setBranches(d))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const chartData = branches.map((b) => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
    balance: b.totalBalance,
    deposit: b.totalDeposit,
    withdrawal: b.totalWithdrawal,
    pl: b.totalPL,
  }));

  const allStatuses = Array.from(
    new Set(branches.flatMap((b) => Object.keys(b.statusBreakdown)))
  );

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <GitCompare className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Branch Comparison</h2>
        </div>

        {/* P/L Comparison Chart */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">P/L Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatINR(Number(value)), '']}
                />
                <Legend />
                <Bar dataKey="deposit" fill="#22c55e" name="Total Deposit" radius={[2, 2, 0, 0]} />
                <Bar dataKey="withdrawal" fill="#ef4444" name="Total Withdrawal" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pl" fill="#3b82f6" name="P/L" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-700/30">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Branch</th>
                  <th className="text-center py-3 px-3 text-slate-300 font-semibold">Accounts</th>
                  <th className="text-right py-3 px-3 text-slate-300 font-semibold">Total Balance</th>
                  <th className="text-right py-3 px-3 text-green-400 font-semibold">Total Deposit</th>
                  <th className="text-right py-3 px-3 text-red-400 font-semibold">Total Withdrawal</th>
                  <th className="text-right py-3 px-3 text-blue-400 font-semibold">P/L</th>
                  {allStatuses.map((s) => (
                    <th key={s} className="text-center py-3 px-3 text-slate-300 font-semibold">
                      {STATUS_LABELS[s] || s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`border-t border-slate-700/30 ${i % 2 === 0 ? '' : 'bg-slate-700/10'} hover:bg-slate-700/20`}
                  >
                    <td className="py-2.5 px-4 text-white font-medium">{b.name}</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{b.accountCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white">{formatINR(b.totalBalance)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-green-400">{formatINR(b.totalDeposit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-red-400">{formatINR(b.totalWithdrawal)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-semibold ${b.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {b.totalPL >= 0 ? '+' : ''}{formatINR(b.totalPL)}
                    </td>
                    {allStatuses.map((s) => (
                      <td key={s} className="py-2.5 px-3 text-center text-slate-300">
                        {b.statusBreakdown[s] ? `${b.statusBreakdown[s].count}` : '0'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-700/30 border-t border-slate-600/50">
                  <td className="py-2.5 px-4 text-white font-bold">Total</td>
                  <td className="py-2.5 px-3 text-center text-white font-bold">
                    {branches.reduce((s, b) => s + b.accountCount, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-white font-bold">
                    {formatINR(branches.reduce((s, b) => s + b.totalBalance, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-green-400 font-bold">
                    {formatINR(branches.reduce((s, b) => s + b.totalDeposit, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-400 font-bold">
                    {formatINR(branches.reduce((s, b) => s + b.totalWithdrawal, 0))}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    branches.reduce((s, b) => s + b.totalPL, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatINR(branches.reduce((s, b) => s + b.totalPL, 0))}
                  </td>
                  {allStatuses.map((s) => (
                    <td key={s} className="py-2.5 px-3 text-center text-white font-bold">
                      {branches.reduce((sum, b) => sum + (b.statusBreakdown[s]?.count || 0), 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
