import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DownloadOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  dateRange?: { from?: string; to?: string };
  summaryRow?: (string | number)[];
}

export function downloadPDF(options: DownloadOptions) {
  const { title, filename, headers, rows, dateRange, summaryRow } = options;

  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? 'landscape' : 'portrait' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 18);

  // Date range subtitle
  let startY = 26;
  if (dateRange?.from || dateRange?.to) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const rangeText = dateRange.from && dateRange.to
      ? `Period: ${dateRange.from} to ${dateRange.to}`
      : dateRange.from
        ? `From: ${dateRange.from}`
        : `To: ${dateRange.to}`;
    doc.text(rangeText, 14, startY);
    startY += 6;
  }

  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, startY);
  startY += 6;

  const allRows = summaryRow ? [...rows, summaryRow] : rows;

  autoTable(doc, {
    head: [headers],
    body: allRows.map((row) => row.map((cell) => String(cell))),
    startY,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    didParseCell: (data) => {
      // Bold the summary/total row
      if (summaryRow && data.row.index === allRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
  });

  doc.save(`${filename}.pdf`);
}

export function downloadExcel(options: DownloadOptions) {
  const { title, filename, headers, rows, dateRange, summaryRow } = options;

  const wsData: (string | number)[][] = [];

  // Title row
  wsData.push([title]);
  
  // Date range
  if (dateRange?.from || dateRange?.to) {
    const rangeText = dateRange.from && dateRange.to
      ? `Period: ${dateRange.from} to ${dateRange.to}`
      : dateRange.from
        ? `From: ${dateRange.from}`
        : `To: ${dateRange.to}`;
    wsData.push([rangeText]);
  }
  
  // Generated date
  wsData.push([`Generated: ${new Date().toLocaleString('en-IN')}`]);
  wsData.push([]); // empty row

  // Headers
  wsData.push(headers);

  // Data rows
  rows.forEach((row) => wsData.push(row));

  // Summary row
  if (summaryRow) {
    wsData.push(summaryRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 35) };
  });
  ws['!cols'] = colWidths;

  // Merge title cell across all columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Helper to format transaction rows for PDF/Excel
export function formatTransactionRows(
  txList: { createdAt: string; type: string; amount: number; balanceBefore: number; balanceAfter: number; description?: string | null; fromAccount: { fullName: string; accountNumber: string }; toAccount?: { fullName: string; accountNumber: string } | null; createdBy: { fullName: string }; toAccountId?: string | null; fromAccountId?: string }[],
  contextAccountId?: string,
) {
  const headers = ['Date', 'Type', 'From Account', 'To Account', 'Amount', 'Balance Before', 'Balance After', 'Description', 'Created By'];

  const typeLabels: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER: 'Transfer',
    OUT_TRANSFER: 'Out Transfer',
    IN_TRANSFER: 'In Transfer',
  };

  const rows = txList.map((tx) => {
    const date = new Date(tx.createdAt);
    const dateStr =
      date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const isCredit = contextAccountId
      ? tx.type === 'DEPOSIT' || (tx.toAccountId === contextAccountId && tx.fromAccountId !== contextAccountId)
      : tx.type === 'DEPOSIT' || tx.type === 'IN_TRANSFER';

    const amountStr = (isCredit ? '+' : '-') + '₹' + tx.amount.toLocaleString('en-IN');

    return [
      dateStr,
      typeLabels[tx.type] || tx.type,
      tx.fromAccount.fullName + ' (' + tx.fromAccount.accountNumber + ')',
      tx.toAccount ? tx.toAccount.fullName + ' (' + tx.toAccount.accountNumber + ')' : '-',
      amountStr,
      '₹' + tx.balanceBefore.toLocaleString('en-IN'),
      '₹' + tx.balanceAfter.toLocaleString('en-IN'),
      tx.description || '-',
      tx.createdBy.fullName,
    ];
  });

  const totalAmount = txList.reduce((sum, tx) => sum + tx.amount, 0);
  const summaryRow = ['TOTAL (' + txList.length + ' transactions)', '', '', '', '₹' + totalAmount.toLocaleString('en-IN'), '', '', '', ''];

  return { headers, rows, summaryRow };
}

// Helper to format expense rows for PDF/Excel
export function formatExpenseRows(
  expenses: { createdAt: string; amount: number; reason: string; balanceBefore: number; balanceAfter: number; account: { fullName: string; accountNumber: string; bankName: string }; branch: { name: string }; createdBy: { fullName: string } }[],
) {
  const headers = ['Date', 'Branch', 'Account', 'Bank', 'Reason', 'Amount', 'Balance Before', 'Balance After', 'By'];

  const rows = expenses.map((exp) => {
    const date = new Date(exp.createdAt);
    const dateStr =
      date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return [
      dateStr,
      exp.branch.name,
      exp.account.fullName + ' (' + exp.account.accountNumber + ')',
      exp.account.bankName,
      exp.reason,
      '-₹' + exp.amount.toLocaleString('en-IN'),
      '₹' + exp.balanceBefore.toLocaleString('en-IN'),
      '₹' + exp.balanceAfter.toLocaleString('en-IN'),
      exp.createdBy.fullName,
    ];
  });

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const summaryRow = ['TOTAL (' + expenses.length + ' expenses)', '', '', '', '', '-₹' + totalAmount.toLocaleString('en-IN'), '', '', ''];

  return { headers, rows, summaryRow };
}
