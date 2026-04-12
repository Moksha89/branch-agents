export type AccountStatus = 'ACTIVE' | 'DEBIT_FREEZE' | 'CREDIT_FREEZE' | 'CYBER' | 'CLOSED';

export interface BankAccount {
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

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bankAccounts: BankAccount[];
}

export interface Transaction {
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

export interface AllBranch {
  id: string;
  name: string;
  bankAccounts: { id: string; fullName: string; accountNumber: string }[];
}

export type TxType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'OUT_TRANSFER';
export type TabType = 'accounts' | 'transactions' | 'daily-report';

export interface DailyReport {
  id: string;
  date: string;
  totalDeposit: number;
  totalWithdrawal: number;
  playerBalance: number;
  profitLoss: number;
  createdBy: { id: string; fullName: string; username: string };
  createdAt: string;
}

export const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  DEBIT_FREEZE: { label: 'Debit Freeze', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  CREDIT_FREEZE: { label: 'Credit Freeze', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  CYBER: { label: 'Cyber', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  CLOSED: { label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30' },
};

export function txTypeBadge(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'WITHDRAWAL': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'TRANSFER': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'OUT_TRANSFER': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}

export function txTypeShort(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'D';
    case 'WITHDRAWAL': return 'W';
    case 'TRANSFER': return 'T';
    case 'OUT_TRANSFER': return 'OT';
    default: return type;
  }
}

export function txTypeLabel(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'Deposit';
    case 'WITHDRAWAL': return 'Withdrawal';
    case 'TRANSFER': return 'Internal Transfer';
    case 'OUT_TRANSFER': return 'Out Transfer';
    default: return type;
  }
}

export function txTypeColor(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'text-green-400';
    case 'WITHDRAWAL': return 'text-red-400';
    case 'TRANSFER': return 'text-blue-400';
    case 'OUT_TRANSFER': return 'text-orange-400';
    default: return 'text-white';
  }
}

export function maskNumber(num: string): string {
  if (!num || num.length <= 4) return num || '';
  return '****' + num.slice(-4);
}

export interface Merchant {
  id: string;
  name: string;
  type: string;
  merchantId: string | null;
  mobileNumber: string | null;
  balance: number;
  qrCodePhoto: string | null;
  bankAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDocument {
  id: string;
  name: string;
  type: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  bankAccountId: string;
  uploadedAt: string;
}

export function filterByDate(txList: Transaction[], dateFrom: string, dateTo: string): Transaction[] {
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
}
