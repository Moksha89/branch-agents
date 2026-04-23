'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import {
  User,
  Lock,
  ShieldCheck,
  ShieldOff,
  Copy,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Clock,
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  telegramLinked: boolean;
  telegramChatId: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Telegram 2FA state
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkPolling, setLinkPolling] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const getToken = () => localStorage.getItem('accessToken') || '';

  const fetchProfile = () => {
    fetch(`${API}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        if (d.telegramLinked && linkPolling) {
          setLinkPolling(false);
          setLinkCode(null);
          showToast('Telegram linked successfully!', 'success');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for link status when waiting for user to send code to bot
  useEffect(() => {
    if (!linkPolling) return;
    const interval = setInterval(fetchProfile, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkPolling]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || 'Failed to change password');
        showToast(data.message || 'Failed to change password', 'error');
        return;
      }
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Unable to connect to server');
      showToast('Unable to connect to server', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerateLinkCode = async () => {
    setLinkLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/telegram/generate-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to generate link code', 'error');
        return;
      }
      setLinkCode(data.code);
      setLinkPolling(true);
    } catch {
      showToast('Failed to connect to server', 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('Remove Telegram 2FA? You will no longer need OTP to login.')) return;
    try {
      const res = await fetch(`${API}/api/auth/telegram/unlink`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, telegramLinked: false, telegramChatId: null } : null);
        setLinkCode(null);
        setLinkPolling(false);
        showToast('Telegram 2FA removed', 'success');
      }
    } catch {
      showToast('Failed to unlink', 'error');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Sidebar>
    );
  }

  if (!profile) {
    return (
      <Sidebar>
        <div className="text-slate-400 text-center py-20">Failed to load profile</div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Profile & Settings</h2>
        </div>

        {/* Profile Info Card */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">{profile.fullName}</h3>
              <p className="text-sm text-slate-400">@{profile.username}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/15 text-blue-400">
                {profile.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Joined </span>
              <span className="text-slate-300">
                {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            {profile.lastLogin && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400">Last login </span>
                <span className="text-slate-300">
                  {new Date(profile.lastLogin).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout for Change Password and Telegram 2FA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password Card */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Telegram 2FA Card */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              {profile.telegramLinked ? (
                <ShieldCheck className="h-5 w-5 text-green-400" />
              ) : (
                <ShieldOff className="h-5 w-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-white">Telegram 2FA</h3>
              {profile.telegramLinked && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/15 text-green-400">
                  Active
                </span>
              )}
            </div>

            {profile.telegramLinked ? (
              /* Linked state */
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400">
                    Two-factor authentication is enabled. A 6-digit OTP will be sent to your Telegram on every login.
                  </p>
                  {profile.telegramChatId && (
                    <p className="text-xs text-slate-400 mt-1">Chat ID: {profile.telegramChatId}</p>
                  )}
                </div>
                <button
                  onClick={handleUnlinkTelegram}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-colors"
                >
                  <ShieldOff className="h-4 w-4" />
                  Remove 2FA
                </button>
              </div>
            ) : linkCode ? (
              /* Link code generated — waiting for user to send to bot */
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Send this code to the Telegram bot to link your account:
                </p>

                <div className="flex items-center justify-center gap-2">
                  <code className="px-4 py-2.5 bg-slate-900 border border-blue-500/30 rounded-lg text-blue-400 font-mono text-2xl font-bold tracking-widest">
                    {linkCode}
                  </code>
                  <button
                    onClick={() => copyCode(linkCode)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                {codeCopied && (
                  <p className="text-center text-xs text-green-400">Copied to clipboard!</p>
                )}

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400 font-medium mb-2">Steps:</p>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Copy the code above</li>
                    <li>Open <a href="https://t.me/Pb_otpbot" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">@Pb_otpbot</a> on Telegram</li>
                    <li>Send the code as a message to the bot</li>
                    <li>This page will update automatically once linked</li>
                  </ol>
                </div>

                <a
                  href="https://t.me/Pb_otpbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-500/25 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open @Pb_otpbot
                </a>

                {linkPolling && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Waiting for you to send the code...
                  </div>
                )}
              </div>
            ) : (
              /* Not linked — show setup button */
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Add an extra layer of security to your account. After setup, you&apos;ll need to enter a 6-digit OTP from Telegram every time you login.
                </p>
                <button
                  onClick={handleGenerateLinkCode}
                  disabled={linkLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {linkLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {linkLoading ? 'Generating...' : 'Set Up Telegram 2FA'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
