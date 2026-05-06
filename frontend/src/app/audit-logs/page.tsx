'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { formatDate } from '@/lib/format-date';
import { Shield, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-green-500/20 text-green-400',
  LOGIN_FAILED: 'bg-red-500/20 text-red-400',
  LOGIN_RATE_LIMITED: 'bg-orange-500/20 text-orange-400',
  CREATE: 'bg-blue-500/20 text-blue-400',
  UPDATE: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  TRANSFER: 'bg-purple-500/20 text-purple-400',
};

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'bg-slate-500/20 text-slate-400';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`${API}/api/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter, startDate, endDate]);

  return (
    <Sidebar>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <span className="text-sm text-slate-400">({total} records)</span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
          >
            <option value="">All Entities</option>
            <option value="auth">Auth</option>
            <option value="branch">Branch</option>
            <option value="account">Account</option>
            <option value="transaction">Transaction</option>
            <option value="user">User</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No audit logs found</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Time</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Entity</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">IP</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 capitalize">{log.entity || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{log.userName || '-'}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                          {log.details ? JSON.parse(log.details).reason || JSON.stringify(JSON.parse(log.details)).slice(0, 80) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2 p-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{log.userName || 'System'}</span>
                      <span className="text-slate-400 capitalize">{log.entity || '-'}</span>
                    </div>
                    {log.ipAddress && <div className="text-xs text-slate-500 font-mono">{log.ipAddress}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages} ({total} records)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
