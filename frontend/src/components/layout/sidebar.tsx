'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  LayoutDashboard,
  GitBranch,
  Users,
  Receipt,
  Landmark,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import GlobalSearch from '@/components/global-search';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  avatar: string | null;
}

const adminRoles = ['SUPER_ADMIN', 'ADMIN'];

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Branches', href: '/branches', icon: GitBranch },
  { label: 'Accounts', href: '/accounts', icon: Landmark },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Users', href: '/users', icon: Users, adminOnly: true },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[55] w-64 flex-shrink-0 bg-slate-800/90 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600" />
            <h1 className="text-lg font-semibold text-white">Systematic Web</h1>
            <button
              className="ml-auto lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search (sidebar) */}
          <div className="px-3 pt-3">
            <GlobalSearch />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.filter((item) => !('adminOnly' in item && item.adminOnly) || (user && adminRoles.includes(user.role))).map((item) => {
              const isActive =
                item.href === '/branches'
                    ? pathname === '/branches' || pathname.startsWith('/branches/')
                    : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-slate-700/50">
            <Link
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/profile'
                  ? 'bg-blue-600/20'
                  : 'hover:bg-slate-700/50'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              <Settings className={`h-4 w-4 flex-shrink-0 ${
                pathname === '/profile' ? 'text-blue-400' : 'text-slate-500'
              }`} />
            </Link>
            <div className="flex items-center justify-end px-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-30">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              className="text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-blue-600" />
            <span className="text-sm font-semibold text-white">Systematic Web</span>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
