import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { PrismaService } from '../prisma/prisma.service';

interface AccountRow {
  fullName: string;
  bankName: string;
  accountNumber: string;
  bankBalance: number;
  status: string;
}

interface StatusSummary {
  status: string;
  count: number;
  total: number;
}

@Injectable()
export class ReportImageService {
  constructor(private prisma: PrismaService) {}

  async generateReportPNG(reportId: string): Promise<Buffer> {
    // Fetch report with branch
    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        branch: true,
        createdBy: { select: { fullName: true } },
      },
    });
    if (!report) throw new Error('Report not found');

    // Fetch branch accounts
    const accounts = await this.prisma.bankAccount.findMany({
      where: { branchId: report.branchId },
      select: {
        fullName: true,
        bankName: true,
        accountNumber: true,
        bankBalance: true,
        status: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Fetch yesterday's report for comparison
    const reportDate = new Date(report.date);
    const yesterday = new Date(reportDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayReport = await this.prisma.dailyReport.findFirst({
      where: {
        branchId: report.branchId,
        date: yesterday,
      },
    });

    // Calculate status summaries
    const statusMap: Record<string, { count: number; total: number }> = {};
    let grandTotal = 0;
    for (const acc of accounts) {
      if (!statusMap[acc.status]) statusMap[acc.status] = { count: 0, total: 0 };
      statusMap[acc.status].count++;
      statusMap[acc.status].total += Number(acc.bankBalance);
      grandTotal += Number(acc.bankBalance);
    }
    const statusSummaries: StatusSummary[] = Object.entries(statusMap).map(([status, data]) => ({
      status,
      ...data,
    }));

    // Generate PNG
    return this.drawReport(
      report.branch.name,
      report.date,
      accounts.map(a => ({ ...a, bankBalance: Number(a.bankBalance) })),
      statusSummaries,
      grandTotal,
      Number(report.totalDeposit),
      Number(report.totalWithdrawal),
      Number(report.profitLoss),
      Number(report.playerBalance),
      yesterdayReport
        ? {
            totalDeposit: Number(yesterdayReport.totalDeposit),
            totalWithdrawal: Number(yesterdayReport.totalWithdrawal),
            profitLoss: Number(yesterdayReport.profitLoss),
            playerBalance: Number(yesterdayReport.playerBalance),
          }
        : null,
      report.createdBy.fullName,
    );
  }

  private drawReport(
    branchName: string,
    reportDate: Date,
    accounts: AccountRow[],
    statusSummaries: StatusSummary[],
    grandTotal: number,
    totalDeposit: number,
    totalWithdrawal: number,
    profitLoss: number,
    playerBalance: number,
    yesterdayData: { totalDeposit: number; totalWithdrawal: number; profitLoss: number; playerBalance: number } | null,
    createdBy: string,
  ): Buffer {
    const W = 900;
    const PADDING = 30;
    const ROW_H = 28;
    const HEADER_H = 36;

    // Calculate height
    let h = PADDING; // top padding
    h += 50; // title
    h += 25; // date line
    h += 20; // gap

    // Accounts table
    h += 25; // section title
    h += HEADER_H; // table header
    h += accounts.length * ROW_H; // rows
    h += ROW_H; // total row
    h += 25; // gap

    // Status summary
    h += 25; // section title
    h += HEADER_H; // header
    h += statusSummaries.length * ROW_H; // rows
    h += 25; // gap

    // P/L section
    h += 25; // section title
    h += 6 * ROW_H; // today rows
    if (yesterdayData) {
      h += 15; // gap
      h += 25; // yesterday title
      h += 4 * ROW_H; // yesterday rows
    }
    h += 25; // gap

    // Footer
    h += 30;
    h += PADDING; // bottom

    const canvas = createCanvas(W, h);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, h);

    let y = PADDING;

    // ===== TITLE =====
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Daily Report — ${branchName}`, PADDING, y + 30);
    y += 50;

    // Date & timestamp
    const dateStr = new Date(reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Report Date: ${dateStr}  |  Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${timeStr}`, PADDING, y + 15);
    y += 25;
    y += 20;

    // ===== ACCOUNT BALANCES TABLE =====
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Account Balances', PADDING, y + 15);
    y += 25;

    const cols = [
      { label: '#', x: PADDING, w: 35 },
      { label: 'Name', x: PADDING + 35, w: 180 },
      { label: 'Bank', x: PADDING + 215, w: 150 },
      { label: 'Account #', x: PADDING + 365, w: 150 },
      { label: 'Status', x: PADDING + 515, w: 120 },
      { label: 'Balance', x: PADDING + 635, w: W - PADDING * 2 - 635 },
    ];

    // Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(PADDING, y, W - PADDING * 2, HEADER_H);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    for (const col of cols) {
      ctx.fillText(col.label, col.x + 8, y + 23);
    }
    y += HEADER_H;

    // Rows
    accounts.forEach((acc, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#1e293b80' : '#0f172a';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(String(idx + 1), cols[0].x + 8, y + 19);
      ctx.fillText(acc.fullName.substring(0, 22), cols[1].x + 8, y + 19);
      ctx.fillText(acc.bankName.substring(0, 18), cols[2].x + 8, y + 19);
      ctx.fillText(this.maskAccount(acc.accountNumber), cols[3].x + 8, y + 19);
      ctx.fillStyle = this.statusColor(acc.status);
      ctx.fillText(this.statusLabel(acc.status), cols[4].x + 8, y + 19);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`₹${acc.bankBalance.toLocaleString('en-IN')}`, cols[5].x + 8, y + 19);
      y += ROW_H;
    });

    // Total row
    ctx.fillStyle = '#1e40af40';
    ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`TOTAL (${accounts.length} accounts)`, cols[1].x + 8, y + 19);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`₹${grandTotal.toLocaleString('en-IN')}`, cols[5].x + 8, y + 19);
    y += ROW_H;
    y += 25;

    // ===== STATUS SUMMARY =====
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Balance by Status', PADDING, y + 15);
    y += 25;

    const statusCols = [
      { label: 'Status', x: PADDING, w: 200 },
      { label: 'Accounts', x: PADDING + 200, w: 150 },
      { label: 'Total Balance', x: PADDING + 350, w: W - PADDING * 2 - 350 },
    ];

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(PADDING, y, W - PADDING * 2, HEADER_H);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    for (const col of statusCols) {
      ctx.fillText(col.label, col.x + 8, y + 23);
    }
    y += HEADER_H;

    statusSummaries.forEach((ss, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#1e293b80' : '#0f172a';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.fillStyle = this.statusColor(ss.status);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(this.statusLabel(ss.status), statusCols[0].x + 8, y + 19);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      ctx.fillText(String(ss.count), statusCols[1].x + 8, y + 19);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`₹${ss.total.toLocaleString('en-IN')}`, statusCols[2].x + 8, y + 19);
      y += ROW_H;
    });
    y += 25;

    // ===== P/L SECTION =====
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText("Today's P/L Summary", PADDING, y + 15);
    y += 25;

    const plRows = [
      { label: 'Total Deposit', value: `₹${totalDeposit.toLocaleString('en-IN')}`, color: '#4ade80' },
      { label: 'Total Withdrawal', value: `₹${totalWithdrawal.toLocaleString('en-IN')}`, color: '#f87171' },
      { label: 'P/L (Deposit - Withdrawal)', value: `${profitLoss >= 0 ? '+' : ''}₹${profitLoss.toLocaleString('en-IN')}`, color: profitLoss >= 0 ? '#4ade80' : '#f87171' },
      { label: 'Player Balance', value: `₹${playerBalance.toLocaleString('en-IN')}`, color: '#60a5fa' },
      { label: 'Total Account Balances', value: `₹${grandTotal.toLocaleString('en-IN')}`, color: '#facc15' },
    ];

    for (let i = 0; i < plRows.length; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1e293b80' : '#0f172a';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText(plRows[i].label, PADDING + 8, y + 19);
      ctx.fillStyle = plRows[i].color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(plRows[i].value, PADDING + 400, y + 19);
      y += ROW_H;
    }

    // Yesterday's data
    if (yesterdayData) {
      y += 15;
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText("Yesterday's P/L Summary", PADDING, y + 15);
      y += 25;

      const yRows = [
        { label: 'Total Deposit', value: `₹${yesterdayData.totalDeposit.toLocaleString('en-IN')}`, color: '#4ade80' },
        { label: 'Total Withdrawal', value: `₹${yesterdayData.totalWithdrawal.toLocaleString('en-IN')}`, color: '#f87171' },
        { label: 'P/L (Deposit - Withdrawal)', value: `${yesterdayData.profitLoss >= 0 ? '+' : ''}₹${yesterdayData.profitLoss.toLocaleString('en-IN')}`, color: yesterdayData.profitLoss >= 0 ? '#4ade80' : '#f87171' },
        { label: 'Player Balance', value: `₹${yesterdayData.playerBalance.toLocaleString('en-IN')}`, color: '#60a5fa' },
      ];

      for (let i = 0; i < yRows.length; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1e293b80' : '#0f172a';
        ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText(yRows[i].label, PADDING + 8, y + 19);
        ctx.fillStyle = yRows[i].color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(yRows[i].value, PADDING + 400, y + 19);
        y += ROW_H;
      }
    } else {
      y += ROW_H;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('No report available for yesterday', PADDING + 8, y - 5);
    }

    y += 25;

    // ===== FOOTER =====
    ctx.fillStyle = '#334155';
    ctx.fillRect(PADDING, y, W - PADDING * 2, 1);
    y += 10;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Generated by ${createdBy}  |  Systematic Web  |  ${branchName}`, PADDING, y + 12);

    return canvas.toBuffer('image/png');
  }

  private maskAccount(num: string): string {
    if (num.length <= 4) return num;
    return '****' + num.slice(-4);
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Active',
      DEBIT_FREEZE: 'Debit Freeze',
      CREDIT_FREEZE: 'Credit Freeze',
      CYBER: 'Cyber',
      CLOSED: 'Closed',
    };
    return map[status] || status;
  }

  private statusColor(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: '#4ade80',
      DEBIT_FREEZE: '#facc15',
      CREDIT_FREEZE: '#fb923c',
      CYBER: '#f87171',
      CLOSED: '#94a3b8',
    };
    return map[status] || '#e2e8f0';
  }
}
