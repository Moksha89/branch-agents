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

    // Fetch the LAST available report before this one (not just yesterday)
    const previousReport = await this.prisma.dailyReport.findFirst({
      where: {
        branchId: report.branchId,
        date: { lt: report.date },
      },
      orderBy: { date: 'desc' },
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
      previousReport
        ? {
            date: previousReport.date,
            totalDeposit: Number(previousReport.totalDeposit),
            totalWithdrawal: Number(previousReport.totalWithdrawal),
            profitLoss: Number(previousReport.profitLoss),
            playerBalance: Number(previousReport.playerBalance),
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
    previousData: { date: Date; totalDeposit: number; totalWithdrawal: number; profitLoss: number; playerBalance: number } | null,
    createdBy: string,
  ): Buffer {
    const W = 900;
    const PADDING = 30;
    const ROW_H = 30;
    const HEADER_H = 38;

    // Calculate height
    let h = PADDING;
    h += 55; // title
    h += 25; // date line
    h += 25; // gap

    // Accounts table
    h += 30; // section title
    h += HEADER_H;
    h += accounts.length * ROW_H;
    h += ROW_H; // total row
    h += 30; // gap

    // Status summary
    h += 30; // section title
    h += HEADER_H;
    h += statusSummaries.length * ROW_H;
    h += 30; // gap

    // P/L section
    h += 30; // section title
    h += 5 * ROW_H; // today rows
    h += 25; // gap
    if (previousData) {
      h += 30; // previous title
      h += 4 * ROW_H;
    } else {
      h += ROW_H;
    }
    h += 30; // gap

    // Footer
    h += 35;
    h += PADDING;

    const canvas = createCanvas(W, h);
    const ctx = canvas.getContext('2d');

    // ===== WHITE BACKGROUND =====
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, h);

    let y = PADDING;

    // ===== HEADER BAR =====
    const headerBarH = 60;
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, W, headerBarH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Daily Report — ${branchName}`, PADDING, 38);
    y = headerBarH + 15;

    // Date & timestamp
    const dateStr = new Date(reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Report Date: ${dateStr}  |  Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${timeStr}`, PADDING, y + 12);
    y += 30;

    // ===== ACCOUNT BALANCES TABLE =====
    this.drawSectionTitle(ctx, 'Account Balances', PADDING, y, '#1e3a5f');
    y += 30;

    const cols = [
      { label: '#', x: PADDING, w: 35 },
      { label: 'Name', x: PADDING + 35, w: 180 },
      { label: 'Bank', x: PADDING + 215, w: 150 },
      { label: 'Account #', x: PADDING + 365, w: 150 },
      { label: 'Status', x: PADDING + 515, w: 120 },
      { label: 'Balance', x: PADDING + 635, w: W - PADDING * 2 - 635 },
    ];

    // Header row
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(PADDING, y, W - PADDING * 2, HEADER_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    for (const col of cols) {
      ctx.fillText(col.label, col.x + 8, y + 24);
    }
    y += HEADER_H;

    // Data rows
    accounts.forEach((acc, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#eef2f7';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      // Row border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(PADDING, y, W - PADDING * 2, ROW_H);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#374151';
      ctx.fillText(String(idx + 1), cols[0].x + 8, y + 20);
      ctx.fillText(acc.fullName.substring(0, 22), cols[1].x + 8, y + 20);
      ctx.fillText(acc.bankName.substring(0, 18), cols[2].x + 8, y + 20);
      ctx.fillText(this.maskAccount(acc.accountNumber), cols[3].x + 8, y + 20);
      ctx.fillStyle = this.statusColorLight(acc.status);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(this.statusLabel(acc.status), cols[4].x + 8, y + 20);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`₹${acc.bankBalance.toLocaleString('en-IN')}`, cols[5].x + 8, y + 20);
      y += ROW_H;
    });

    // Total row
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, y, W - PADDING * 2, ROW_H);
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`TOTAL (${accounts.length} accounts)`, cols[1].x + 8, y + 20);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`₹${grandTotal.toLocaleString('en-IN')}`, cols[5].x + 8, y + 20);
    y += ROW_H;
    y += 25;

    // ===== STATUS SUMMARY =====
    this.drawSectionTitle(ctx, 'Balance by Status', PADDING, y, '#7c3aed');
    y += 30;

    const statusCols = [
      { label: 'Status', x: PADDING, w: 200 },
      { label: 'Accounts', x: PADDING + 200, w: 150 },
      { label: 'Total Balance', x: PADDING + 350, w: W - PADDING * 2 - 350 },
    ];

    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(PADDING, y, W - PADDING * 2, HEADER_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    for (const col of statusCols) {
      ctx.fillText(col.label, col.x + 8, y + 24);
    }
    y += HEADER_H;

    statusSummaries.forEach((ss, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#faf5ff' : '#f3e8ff';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.fillStyle = this.statusColorLight(ss.status);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(this.statusLabel(ss.status), statusCols[0].x + 8, y + 20);
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.fillText(String(ss.count), statusCols[1].x + 8, y + 20);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`₹${ss.total.toLocaleString('en-IN')}`, statusCols[2].x + 8, y + 20);
      y += ROW_H;
    });
    y += 25;

    // ===== TODAY'S P/L SECTION =====
    this.drawSectionTitle(ctx, "Today's P/L Summary", PADDING, y, '#059669');
    y += 30;

    const plRows = [
      { label: 'Total Deposit', value: `₹${totalDeposit.toLocaleString('en-IN')}`, color: '#059669' },
      { label: 'Total Withdrawal', value: `₹${totalWithdrawal.toLocaleString('en-IN')}`, color: '#dc2626' },
      { label: 'P/L (Deposit - Withdrawal)', value: `${profitLoss >= 0 ? '+' : ''}₹${profitLoss.toLocaleString('en-IN')}`, color: profitLoss >= 0 ? '#059669' : '#dc2626' },
      { label: 'Player Balance', value: `₹${playerBalance.toLocaleString('en-IN')}`, color: '#2563eb' },
      { label: 'Total Account Balances', value: `₹${grandTotal.toLocaleString('en-IN')}`, color: '#b45309' },
    ];

    for (let i = 0; i < plRows.length; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#f0fdf4' : '#ecfdf5';
      ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(PADDING, y, W - PADDING * 2, ROW_H);
      ctx.fillStyle = '#4b5563';
      ctx.font = '13px sans-serif';
      ctx.fillText(plRows[i].label, PADDING + 12, y + 20);
      ctx.fillStyle = plRows[i].color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(plRows[i].value, PADDING + 400, y + 20);
      y += ROW_H;
    }

    y += 15;

    // ===== PREVIOUS REPORT DATA =====
    if (previousData) {
      const prevDateStr = new Date(previousData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      this.drawSectionTitle(ctx, `Previous Report (${prevDateStr})`, PADDING, y, '#ea580c');
      y += 30;

      const yRows = [
        { label: 'Total Deposit', value: `₹${previousData.totalDeposit.toLocaleString('en-IN')}`, color: '#059669' },
        { label: 'Total Withdrawal', value: `₹${previousData.totalWithdrawal.toLocaleString('en-IN')}`, color: '#dc2626' },
        { label: 'P/L (Deposit - Withdrawal)', value: `${previousData.profitLoss >= 0 ? '+' : ''}₹${previousData.profitLoss.toLocaleString('en-IN')}`, color: previousData.profitLoss >= 0 ? '#059669' : '#dc2626' },
        { label: 'Player Balance', value: `₹${previousData.playerBalance.toLocaleString('en-IN')}`, color: '#2563eb' },
      ];

      for (let i = 0; i < yRows.length; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#fff7ed' : '#ffedd5';
        ctx.fillRect(PADDING, y, W - PADDING * 2, ROW_H);
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(PADDING, y, W - PADDING * 2, ROW_H);
        ctx.fillStyle = '#4b5563';
        ctx.font = '13px sans-serif';
        ctx.fillText(yRows[i].label, PADDING + 12, y + 20);
        ctx.fillStyle = yRows[i].color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(yRows[i].value, PADDING + 400, y + 20);
        y += ROW_H;
      }
    } else {
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText('No previous report available for this branch', PADDING + 12, y + 12);
      y += ROW_H;
    }

    y += 20;

    // ===== FOOTER =====
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, y - 5, W, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Generated by ${createdBy}  |  Systematic Web  |  ${branchName}`, PADDING, y + 14);

    return canvas.toBuffer('image/png');
  }

  private drawSectionTitle(ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>, title: string, x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(title, x, y + 14);
    // Underline
    const textWidth = ctx.measureText(title).width;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + textWidth + 5, y + 18);
    ctx.stroke();
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

  private statusColorLight(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: '#059669',
      DEBIT_FREEZE: '#d97706',
      CREDIT_FREEZE: '#ea580c',
      CYBER: '#dc2626',
      CLOSED: '#6b7280',
    };
    return map[status] || '#374151';
  }
}
