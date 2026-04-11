'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Landmark,
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';

interface BankAccount {
  id: string;
  fullName: string;
  mobileNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  bankBalance: number;
  createdAt: string;
  createdBy: { id: string; fullName: string; username: string };
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  bankAccounts: BankAccount[];
}

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchBranch = async () => {
      try {
        const res = await fetch(`${apiUrl}/branches/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          setError('Branch not found');
          return;
        }
        const data = await res.json();
        setBranch(data);
      } catch {
        setError('Failed to load branch');
      } finally {
        setLoading(false);
      }
    };

    fetchBranch();
  }, [apiUrl, branchId, router]);

  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '****' + num.slice(-4);
  };

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/branches">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branches
              </Button>
            </Link>
          </div>
        ) : branch ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Link href="/branches" className="hover:text-white transition-colors">
                Branches
              </Link>
              <span>/</span>
              <span className="text-white">{branch.name}</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{branch.name}</h2>
                  <p className="text-sm text-slate-400">
                    Code: {branch.code}
                    {branch.city && ` | ${branch.city}`}
                    {branch.state && `, ${branch.state}`}
                  </p>
                </div>
              </div>
              <Link href={`/branches/${branch.id}/accounts/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </Link>
            </div>

            {/* Bank accounts */}
            {branch.bankAccounts.length === 0 ? (
              <div className="text-center py-20 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <Landmark className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No bank accounts yet
                </h3>
                <p className="text-slate-500 mb-6">
                  Add the first bank account to this branch
                </p>
                <Link href={`/branches/${branch.id}/accounts/new`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {branch.bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {account.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{account.fullName}</h4>
                          <p className="text-sm text-slate-400">{account.bankName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-semibold text-green-400">
                          {account.bankBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/30">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">A/C: {maskNumber(account.accountNumber)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Landmark className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">IFSC: {account.ifscCode}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">{account.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-400">By: {account.createdBy.fullName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </Sidebar>
  );
}
