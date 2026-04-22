'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GitBranch,
  Plus,
  Building2,
  Hash,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { bankAccounts: number };
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [branchName, setBranchName] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  const getToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return null;
    }
    return token;
  };

  const fetchBranches = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setBranches(data);
    } catch {
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: branchName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create branch');
        return;
      }
      setShowCreate(false);
      setBranchName('');
      await fetchBranches();
    } catch {
      setError('Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Branches</h2>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Branch
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Create branch modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Create Branch</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Branch Name *</Label>
                  <Input
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Hyderabad Branch"
                    required
                    autoFocus
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? 'Creating...' : 'Create Branch'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Branch list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No branches yet</h3>
            <p className="text-slate-500 mb-6">Create your first branch to start adding bank accounts</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Branch
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Link
                key={branch.id}
                href={`/branches/${branch.id}`}
                className="block rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                    {branch.code}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                  {branch.name}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-3 pt-3 border-t border-slate-700/50">
                  <Hash className="h-3.5 w-3.5" />
                  {branch._count.bankAccounts} bank account{branch._count.bankAccounts !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
