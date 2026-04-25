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
  Search,
  MapPin,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { handleEnterKeyNavigation } from '@/lib/form-utils';
import { showToast } from '@/components/ui/toast';
import { downloadPDF, downloadExcel } from '@/lib/download-utils';

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
  const [branchAddress, setBranchAddress] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchState, setBranchState] = useState('');
  const [branchPincode, setBranchPincode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleDownloadBranches = (format: 'pdf' | 'excel') => {
    const filtered = branches.filter((b) => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const headers = ['Name', 'Code', 'City', 'State', 'Accounts', 'Created'];
    const rows = filtered.map((b) => [
      b.name,
      b.code,
      b.city || '-',
      b.state || '-',
      b._count.bankAccounts,
      new Date(b.createdAt).toLocaleDateString('en-IN'),
    ]);
    const opts = { title: 'Branches Report', filename: 'branches-report', headers, rows };
    if (format === 'pdf') downloadPDF(opts);
    else downloadExcel(opts);
    setShowDownloadMenu(false);
  };

  // Esc key handler for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreate) setShowCreate(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showCreate]);

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
        body: JSON.stringify({
          name: branchName,
          address: branchAddress || undefined,
          city: branchCity || undefined,
          state: branchState || undefined,
          pincode: branchPincode || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data.message || 'Failed to create branch';
        setError(msg);
        showToast(msg, 'error');
        return;
      }
      setShowCreate(false);
      setBranchName('');
      setBranchAddress('');
      setBranchCity('');
      setBranchState('');
      setBranchPincode('');
      showToast('Branch created successfully', 'success');
      await fetchBranches();
    } catch {
      setError('Failed to create branch');
      showToast('Failed to create branch', 'error');
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
              >
                <Download className="h-4 w-4" /> Download <ChevronDown className="h-3 w-3" />
              </button>
              {showDownloadMenu && (
                <>
                  <div className="fixed inset-0 z-[50]" onClick={() => setShowDownloadMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[51] py-1 min-w-[140px]">
                    <button onClick={() => handleDownloadBranches('pdf')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                      <FileText className="h-4 w-4 text-red-400" /> PDF
                    </button>
                    <button onClick={() => handleDownloadBranches('excel')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                      <FileSpreadsheet className="h-4 w-4 text-green-400" /> Excel
                    </button>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Branch
          </Button>
          </div>
        </div>

        {/* Search */}
        {branches.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search branches by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

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
              <form onSubmit={handleCreate} className="p-6 space-y-4" onKeyDown={handleEnterKeyNavigation}>
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
                <div className="space-y-2">
                  <Label className="text-slate-300">Address</Label>
                  <Input
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    placeholder="Street address"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">City</Label>
                    <Input
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      placeholder="City"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">State</Label>
                    <Input
                      value={branchState}
                      onChange={(e) => setBranchState(e.target.value)}
                      placeholder="State"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Pincode</Label>
                  <Input
                    value={branchPincode}
                    onChange={(e) => setBranchPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    maxLength={6}
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
            {branches
              .filter((b) => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((branch) => (
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
                {(branch.city || branch.state) && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    {[branch.city, branch.state].filter(Boolean).join(', ')}
                  </p>
                )}
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
