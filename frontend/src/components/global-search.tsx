'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User, GitBranch, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SearchResults {
  accounts: {
    id: string;
    fullName: string;
    bankName: string;
    accountNumber: string;
    bankBalance: number;
    status: string;
    branch: { id: string; name: string };
  }[];
  branches: {
    id: string;
    name: string;
    code: string;
    city: string | null;
    _count: { bankAccounts: number };
  }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
    fromAccount: { id: string; fullName: string; branch: { id: string; name: string } };
    toAccount: { id: string; fullName: string } | null;
  }[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch {}
      setLoading(false);
    }, 300);
  }, [query]);

  const totalResults = results
    ? results.accounts.length + results.branches.length + results.transactions.length
    : 0;

  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search accounts, branches, transactions..."
          className="w-full pl-9 pr-8 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {loading && (
            <div className="p-3 text-center text-slate-400 text-sm">Searching...</div>
          )}
          {!loading && totalResults === 0 && (
            <div className="p-3 text-center text-slate-400 text-sm">No results found</div>
          )}

          {results.branches.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/80 sticky top-0">
                Branches ({results.branches.length})
              </div>
              {results.branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { router.push(`/branches/${b.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 text-left"
                >
                  <GitBranch className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{b.name}</p>
                    <p className="text-[10px] text-slate-400">{b.code} {b.city ? `• ${b.city}` : ''} • {b._count.bankAccounts} accounts</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.accounts.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/80 sticky top-0">
                Accounts ({results.accounts.length})
              </div>
              {results.accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { router.push(`/branches/${a.branch.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 text-left"
                >
                  <User className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.fullName}</p>
                    <p className="text-[10px] text-slate-400">{a.bankName} • {a.accountNumber} • {a.branch.name}</p>
                  </div>
                  <span className="text-xs font-mono text-green-400">{formatINR(Number(a.bankBalance))}</span>
                </button>
              ))}
            </div>
          )}

          {results.transactions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/80 sticky top-0">
                Transactions ({results.transactions.length})
              </div>
              {results.transactions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { router.push(`/branches/${t.fromAccount.branch.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 text-left"
                >
                  <ArrowUpDown className={`h-4 w-4 flex-shrink-0 ${
                    t.type === 'DEPOSIT' ? 'text-green-400' : t.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t.description || t.type}</p>
                    <p className="text-[10px] text-slate-400">{t.fromAccount.fullName} • {new Date(t.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-xs font-mono ${t.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'DEPOSIT' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
