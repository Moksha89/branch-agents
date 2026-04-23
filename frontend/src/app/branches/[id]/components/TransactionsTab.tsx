'use client';

import { useState } from 'react';
import { Download, ListFilter, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Transaction } from './types';
import TransactionTable from './TransactionTable';
import { downloadPDF, downloadExcel, formatTransactionRows } from '@/lib/download-utils';

interface TransactionsTabProps {
  loading: boolean;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  branchName: string;
  onDownloadCSV: (txList: Transaction[], filename: string) => void;
}

export default function TransactionsTab({
  loading,
  transactions,
  filteredTransactions,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  branchName,
  onDownloadCSV,
}: TransactionsTabProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleDownloadPDF = () => {
    const { headers, rows, summaryRow } = formatTransactionRows(filteredTransactions);
    const filename = `${branchName.replace(/\s+/g, '_')}_Transactions`;
    downloadPDF({
      title: `${branchName} — Transactions`,
      filename,
      headers,
      rows,
      summaryRow,
      dateRange: { from: dateFrom, to: dateTo },
    });
    setShowDownloadMenu(false);
  };

  const handleDownloadExcel = () => {
    const { headers, rows, summaryRow } = formatTransactionRows(filteredTransactions);
    const filename = `${branchName.replace(/\s+/g, '_')}_Transactions`;
    downloadExcel({
      title: `${branchName} — Transactions`,
      filename,
      headers,
      rows,
      summaryRow,
      dateRange: { from: dateFrom, to: dateTo },
    });
    setShowDownloadMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <ListFilter className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No transactions yet</h3>
        <p className="text-slate-500">
          Transactions will appear here when you make deposits, withdrawals, or transfers
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-slate-400 hover:text-white transition-colors underline"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">{filteredTransactions.length} transactions</span>
          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
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
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-400" />
                    Download Excel
                  </button>
                  <button
                    onClick={() => { onDownloadCSV(filteredTransactions, `${branchName.replace(/\s+/g, '_')}_Transactions`); setShowDownloadMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Download className="h-4 w-4 text-blue-400" />
                    Download CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-10 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-500 text-sm">No transactions found for the selected date range</p>
        </div>
      ) : (
        <TransactionTable txList={filteredTransactions} />
      )}
    </>
  );
}
