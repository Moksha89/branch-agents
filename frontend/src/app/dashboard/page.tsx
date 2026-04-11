'use client';

import Sidebar from '@/components/layout/sidebar';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>

        {/* Welcome card */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-700/50 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-white mb-2">
            Welcome to Systematic Web!
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
      </div>
    </Sidebar>
  );
}
