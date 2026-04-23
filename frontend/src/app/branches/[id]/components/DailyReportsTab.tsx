'use client';

import { CalendarDays, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { DailyReport } from './types';
import { handleEnterKeyNavigation } from '@/lib/form-utils';

interface DailyReportsTabProps {
  loading: boolean;
  reports: DailyReport[];
  showForm: boolean;
  editingReportId: string | null;
  reportDate: string;
  reportDeposit: string;
  reportWithdrawal: string;
  reportPlayerBalance: string;
  reportSubmitting: boolean;
  reportError: string;
  downloadingPNG: string | null;
  confirmDeleteReportId: string | null;
  deletingReportId: string | null;
  setReportDate: (v: string) => void;
  setReportDeposit: (v: string) => void;
  setReportWithdrawal: (v: string) => void;
  setReportPlayerBalance: (v: string) => void;
  setConfirmDeleteReportId: (v: string | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onCreateNew: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
  onDownloadPNG: (id: string, date: string) => void;
  onDownloadCSV: () => void;
}

export default function DailyReportsTab({
  loading,
  reports,
  showForm,
  editingReportId,
  reportDate,
  reportDeposit,
  reportWithdrawal,
  reportPlayerBalance,
  reportSubmitting,
  reportError,
  downloadingPNG,
  confirmDeleteReportId,
  deletingReportId,
  setReportDate,
  setReportDeposit,
  setReportWithdrawal,
  setReportPlayerBalance,
  setConfirmDeleteReportId,
  onSubmit,
  onCancel,
  onCreateNew,
  onEdit,
  onDelete,
  onDownloadPNG,
  onDownloadCSV,
}: DailyReportsTabProps) {
  return (
    <div>
      {/* Create / Edit Form */}
      {showForm ? (
        <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingReportId ? 'Edit Daily Report' : 'Create Daily Report'}
          </h3>
          {reportError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {reportError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4" onKeyDown={handleEnterKeyNavigation}>
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
              onClick={onSubmit}
              disabled={reportSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {reportSubmitting ? 'Saving...' : editingReportId ? 'Update Report' : 'Create Report'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2 mb-4">
          {reports.length > 0 && (
            <button
              onClick={onDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Create Daily Report
          </button>
        </div>
      )}

      {/* Reports Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : reports.length === 0 ? (
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
                {reports.map((report, idx) => (
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
                          onClick={() => onDownloadPNG(report.id, report.date)}
                          disabled={downloadingPNG === report.id}
                          className="px-2 py-1 rounded text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                          title="Download PNG Report"
                        >
                          {downloadingPNG === report.id ? '...' : 'PNG'}
                        </button>
                        <button
                          onClick={() => onEdit(report)}
                          className="px-2 py-1 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                        >
                          Edit
                        </button>
                        {confirmDeleteReportId === report.id ? (
                          <>
                            <button
                              onClick={() => onDelete(report.id)}
                              disabled={deletingReportId === report.id}
                              className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deletingReportId === report.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteReportId(null)}
                              className="px-2 py-1 rounded text-xs font-medium bg-slate-600 text-slate-300 hover:bg-slate-500 transition-colors"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteReportId(report.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800/60 border-t-2 border-slate-600/50">
                  <td className="px-4 py-3 text-slate-300 font-bold border-r border-slate-700/30">TOTAL</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold border-r border-slate-700/30">
                    ₹{reports.reduce((sum, r) => sum + r.totalDeposit, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold border-r border-slate-700/30">
                    ₹{reports.reduce((sum, r) => sum + r.totalWithdrawal, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400 font-bold border-r border-slate-700/30">
                    ₹{reports.reduce((sum, r) => sum + r.playerBalance, 0).toLocaleString('en-IN')}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold border-r border-slate-700/30 ${reports.reduce((sum, r) => sum + r.profitLoss, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {reports.reduce((sum, r) => sum + r.profitLoss, 0) >= 0 ? '+' : ''}₹{reports.reduce((sum, r) => sum + r.profitLoss, 0).toLocaleString('en-IN')}
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
  );
}
