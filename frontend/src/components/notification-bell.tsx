'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, TrendingUp, TrendingDown, ArrowUpDown, Shield, Info } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Notification {
  id: string;
  type: 'transaction' | 'statusChange' | 'bulkOperation' | 'notification';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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
    const s = io(`${API}/notifications`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    s.on('transaction', (data: { type: string; amount: number; accountName: string; branchName: string; timestamp: string; isReversal?: boolean }) => {
      const typeLabels: Record<string, string> = {
        DEPOSIT: 'Deposit',
        WITHDRAWAL: 'Withdrawal',
        TRANSFER: 'Transfer',
        OUT_TRANSFER: 'Out Transfer',
      };
      addNotification({
        type: 'transaction',
        title: data.isReversal ? 'Transaction Reversed' : (typeLabels[data.type] || data.type),
        message: `₹${data.amount.toLocaleString('en-IN')} — ${data.accountName} (${data.branchName})`,
        timestamp: data.timestamp,
      });
    });

    s.on('statusChange', (data: { accountName: string; branchName: string; oldStatus: string; newStatus: string; timestamp: string }) => {
      addNotification({
        type: 'statusChange',
        title: 'Status Changed',
        message: `${data.accountName}: ${data.oldStatus} → ${data.newStatus} (${data.branchName})`,
        timestamp: data.timestamp,
      });
    });

    s.on('bulkOperation', (data: { operation: string; count: number; branchName?: string; timestamp: string }) => {
      addNotification({
        type: 'bulkOperation',
        title: 'Bulk Operation',
        message: `${data.operation}: ${data.count} accounts${data.branchName ? ` in ${data.branchName}` : ''}`,
        timestamp: data.timestamp,
      });
    });

    s.on('notification', (data: { title: string; message: string; timestamp: string }) => {
      addNotification({
        type: 'notification',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
      });
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  function addNotification(n: Omit<Notification, 'id' | 'read'>) {
    setNotifications((prev) => [
      { ...n, id: Date.now().toString(), read: false },
      ...prev.slice(0, 49), // Keep last 50
    ]);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
    setOpen(false);
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <ArrowUpDown className="h-4 w-4" />;
      case 'statusChange': return <Shield className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'text-blue-400 bg-blue-500/15';
      case 'statusChange': return 'text-yellow-400 bg-yellow-500/15';
      case 'bulkOperation': return 'text-purple-400 bg-purple-500/15';
      default: return 'text-slate-400 bg-slate-500/15';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-slate-400 hover:text-white">
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-slate-700/30 last:border-0 ${
                    n.read ? '' : 'bg-slate-700/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">{n.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{n.message}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
