'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { formatDate } from '@/lib/format-date';
import { Monitor, Smartphone, Globe, Trash2, LogOut } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Session {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

function getDeviceIcon(ua: string | null) {
  if (!ua) return <Globe className="h-5 w-5" />;
  if (/mobile|android|iphone/i.test(ua)) return <Smartphone className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function getBrowserInfo(ua: string | null) {
  if (!ua) return 'Unknown';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/edge/i.test(ua)) return 'Edge';
  return 'Other';
}

function getOSInfo(ua: string | null) {
  if (!ua) return 'Unknown';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad/i.test(ua)) return 'iOS';
  return 'Other';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/api/sessions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  };

  const terminateSession = async (id: string) => {
    if (!confirm('Terminate this session? The user will be logged out.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API}/api/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSessions();
    } catch {}
  };

  useEffect(() => { fetchSessions(); }, []);

  return (
    <Sidebar>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
          <span className="text-sm text-slate-400">({sessions.length} active)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No active sessions</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {getBrowserInfo(session.userAgent)} on {getOSInfo(session.userAgent)}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        IP: {session.ipAddress || 'Unknown'}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>Last active: {formatDate(session.lastActivity)}</span>
                        <span>Created: {formatDate(session.createdAt)}</span>
                        <span>Expires: {formatDate(session.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Terminate session"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
