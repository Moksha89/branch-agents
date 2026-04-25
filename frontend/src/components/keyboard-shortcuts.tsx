'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { keys: ['Alt', 'D'], label: 'Go to Dashboard', action: '/dashboard' },
  { keys: ['Alt', 'B'], label: 'Go to Branches', action: '/branches' },
  { keys: ['Alt', 'A'], label: 'Go to Accounts', action: '/accounts' },
  { keys: ['Alt', 'E'], label: 'Go to Expenses', action: '/expenses' },
  { keys: ['Alt', 'U'], label: 'Go to Users', action: '/users' },
  { keys: ['Alt', 'P'], label: 'Go to Profile', action: '/profile' },
  { keys: ['Alt', 'L'], label: 'Go to Audit Log', action: '/audit-logs' },
  { keys: ['Alt', 'S'], label: 'Go to Sessions', action: '/sessions' },
  { keys: ['Alt', 'R'], label: 'Go to Scheduled Reports', action: '/scheduled-reports' },
  { keys: ['?'], label: 'Show keyboard shortcuts', action: 'toggle' },
  { keys: ['Esc'], label: 'Close modal/popup', action: 'close' },
];

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === '?' && !e.altKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      if (e.altKey) {
        const keyMap: Record<string, string> = {
          d: '/dashboard',
          b: '/branches',
          a: '/accounts',
          e: '/expenses',
          u: '/users',
          p: '/profile',
          l: '/audit-logs',
          s: '/sessions',
          r: '/scheduled-reports',
        };
        const path = keyMap[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="h-5 w-5 text-blue-400" />
            <span className="font-medium">Keyboard Shortcuts</span>
          </div>
          <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{s.label}</span>
              <div className="flex gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-slate-700 text-center">
          <span className="text-xs text-slate-500">Press <kbd className="px-1 bg-slate-700 rounded text-slate-400">?</kbd> to toggle this dialog</span>
        </div>
      </div>
    </div>
  );
}
