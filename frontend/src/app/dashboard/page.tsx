'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  avatar: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top bar */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600" />
              <h1 className="text-lg font-semibold text-white">Systematic Web</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>

        {/* Welcome card */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-700/50 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-white mb-2">
            Welcome back, {user.fullName}!
          </h3>
          <p className="text-slate-400">
            Your dashboard is being set up. New features and modules will appear here as they are built.
          </p>
        </div>

        {/* Placeholder stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Total Users', value: '—', color: 'from-blue-500 to-blue-600' },
            { label: 'Active Sessions', value: '—', color: 'from-green-500 to-green-600' },
            { label: 'Reports', value: '—', color: 'from-purple-500 to-purple-600' },
            { label: 'Notifications', value: '—', color: 'from-orange-500 to-orange-600' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5"
            >
              <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${stat.color} mt-3`} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
