'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { formatDate } from '@/lib/format-date';
import { Calendar, Plus, Trash2, Power, PowerOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  time: string;
  branchIds: string | null;
  isActive: boolean;
  lastRun: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00', branchIds: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [reportsRes, branchesRes] = await Promise.all([
        fetch(`${API}/api/scheduled-reports`, { headers }),
        fetch(`${API}/api/branches`, { headers }),
      ]);
      setReports(await reportsRes.json());
      setBranches(await branchesRes.json());
    } catch {}
    setLoading(false);
  };

  const createReport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API}/api/scheduled-reports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          frequency: form.frequency,
          dayOfWeek: form.frequency === 'weekly' ? form.dayOfWeek : undefined,
          dayOfMonth: form.frequency === 'monthly' ? form.dayOfMonth : undefined,
          time: form.time,
          branchIds: form.branchIds || undefined,
        }),
      });
      setShowForm(false);
      setForm({ name: '', frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00', branchIds: '' });
      fetchData();
    } catch {}
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API}/api/scheduled-reports/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchData();
    } catch {}
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this scheduled report?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API}/api/scheduled-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <Sidebar>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Scheduled Reports</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4" /> New Schedule
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
            <h3 className="text-white font-medium mb-4">Create New Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Daily Balance Report"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {form.frequency === 'weekly' && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Day of Week</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  >
                    {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {form.frequency === 'monthly' && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.dayOfMonth}
                    onChange={(e) => setForm({ ...form, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Branches (optional)</label>
                <select
                  value={form.branchIds}
                  onChange={(e) => setForm({ ...form, branchIds: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createReport}
                disabled={!form.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No scheduled reports. Click "New Schedule" to create one.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 ${!report.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{report.name}</div>
                    <div className="flex gap-3 mt-1 text-sm text-slate-400">
                      <span className="capitalize">{report.frequency}</span>
                      {report.frequency === 'weekly' && report.dayOfWeek !== null && (
                        <span>on {dayNames[report.dayOfWeek]}</span>
                      )}
                      {report.frequency === 'monthly' && report.dayOfMonth !== null && (
                        <span>on day {report.dayOfMonth}</span>
                      )}
                      <span>at {report.time}</span>
                    </div>
                    {report.lastRun && (
                      <div className="text-xs text-slate-500 mt-1">Last run: {formatDate(report.lastRun)}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(report.id, report.isActive)}
                      className={`p-2 rounded-lg transition-colors ${report.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-slate-400 hover:bg-slate-700'}`}
                      title={report.isActive ? 'Disable' : 'Enable'}
                    >
                      {report.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
