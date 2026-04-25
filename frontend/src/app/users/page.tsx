'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDateTimeShort, formatDateTime } from '@/lib/format-date';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  X,
  Check,
  GitBranch,
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import { handleEnterKeyNavigation } from '@/lib/form-utils';
import { showToast } from '@/components/ui/toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface BranchAccessItem {
  branchId: string;
  branchName?: string;
  branchCode?: string;
  accessLevel: 'READ' | 'WRITE' | 'FULL';
}

interface UserItem {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  telegramChatId: string | null;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
  branchAccess: BranchAccessItem[];
}

interface BranchItem {
  id: string;
  name: string;
  code: string;
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const ACCESS_LEVELS: ('READ' | 'WRITE' | 'FULL')[] = ['READ', 'WRITE', 'FULL'];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  ADMIN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MANAGER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EMPLOYEE: 'bg-green-500/20 text-green-400 border-green-500/30',
  VIEWER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INACTIVE: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

const accessColors: Record<string, string> = {
  READ: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  WRITE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  FULL: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const RoleIcon = ({ role }: { role: string }) => {
  if (role === 'SUPER_ADMIN') return <ShieldAlert className="h-4 w-4" />;
  if (role === 'ADMIN') return <ShieldCheck className="h-4 w-4" />;
  return <Shield className="h-4 w-4" />;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Esc key handler for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (showModal) setShowModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showModal, deleteConfirm]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    telegramChatId: '',
    role: 'EMPLOYEE' as string,
    status: 'ACTIVE' as string,
    branchAccess: [] as BranchAccessItem[],
  });

  const getToken = () => localStorage.getItem('accessToken') ?? '';

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 403) {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/branches`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBranches(data.map((b: BranchItem) => ({ id: b.id, name: b.name, code: b.code })));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const u = JSON.parse(userData);
        setCurrentUserRole(u.role);
      } catch {
        // ignore
      }
    }
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      telegramChatId: '',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      branchAccess: [],
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      telegramChatId: user.telegramChatId || '',
      role: user.role,
      status: user.status,
      branchAccess: user.branchAccess.map((ba) => ({
        branchId: ba.branchId,
        branchName: ba.branchName,
        accessLevel: ba.accessLevel,
      })),
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    // Inline validation
    const errors: Record<string, string> = {};
    if (!editingUser && !formData.username.trim()) errors.username = 'Username is required';
    if (!editingUser && !formData.password) errors.password = 'Password is required';
    if (!editingUser && formData.password.length > 0 && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email address';
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    setError('');
    try {
      const url = editingUser ? `${API}/api/users/${editingUser.id}` : `${API}/api/users`;
      const method = editingUser ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        telegramChatId: formData.telegramChatId || undefined,
        role: formData.role,
        branchAccess: formData.branchAccess.map((ba) => ({
          branchId: ba.branchId,
          accessLevel: ba.accessLevel,
        })),
      };

      if (!editingUser) {
        body.username = formData.username;
        body.password = formData.password;
      } else {
        if (formData.password) body.password = formData.password;
        body.status = formData.status;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save user');
      }

      setShowModal(false);
      showToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success');
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete user');
      }
      setDeleteConfirm(null);
      showToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setError(msg);
      showToast(msg, 'error');
      setDeleteConfirm(null);
    }
  };

  const toggleBranchAccess = (branchId: string) => {
    setFormData((prev) => {
      const existing = prev.branchAccess.find((ba) => ba.branchId === branchId);
      if (existing) {
        return {
          ...prev,
          branchAccess: prev.branchAccess.filter((ba) => ba.branchId !== branchId),
        };
      }
      const branch = branches.find((b) => b.id === branchId);
      return {
        ...prev,
        branchAccess: [
          ...prev.branchAccess,
          { branchId, branchName: branch?.name, accessLevel: 'READ' as const },
        ],
      };
    });
  };

  const updateAccessLevel = (branchId: string, level: 'READ' | 'WRITE' | 'FULL') => {
    setFormData((prev) => ({
      ...prev,
      branchAccess: prev.branchAccess.map((ba) =>
        ba.branchId === branchId ? { ...ba, accessLevel: level } : ba,
      ),
    }));
  };

  if (!currentUserRole || (currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'ADMIN')) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <h3 className="text-lg font-medium text-white mb-1">Access Denied</h3>
            <p>You need Admin or Super Admin role to manage users.</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">User Management</h2>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New User
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No users yet</h3>
            <p>Create your first user to get started</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Plus className="h-4 w-4 inline mr-1" /> Create User
            </button>
          </div>
        ) : (
          <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.fullName}</p>
                      <p className="text-slate-400 text-xs">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[user.role] || roleColors.EMPLOYEE}`}>
                      <RoleIcon role={user.role} />
                      {user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[user.status] || statusColors.ACTIVE}`}>{user.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Login:</span>{' '}
                    <span className="text-slate-300">{user.lastLogin ? formatDateTimeShort(user.lastLogin) : 'Never'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Access:</span>{' '}
                    {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                      <span className="text-green-400">All Branches</span>
                    ) : user.branchAccess.length === 0 ? (
                      <span className="text-slate-500">No access</span>
                    ) : (
                      <span className="text-slate-300">{user.branchAccess.map((ba) => `${ba.branchName || ba.branchCode} (${ba.accessLevel[0]})`).join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                  <button onClick={() => openEditModal(user)} className="flex-1 py-1.5 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25">Edit</button>
                  {user.username !== 'sarkar' && currentUserRole === 'SUPER_ADMIN' && (
                    deleteConfirm === user.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded text-xs font-medium bg-slate-600 text-slate-300">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(user.id)} className="flex-1 py-1.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25">Delete</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/80">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Branch Access</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Last Login</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.fullName}</p>
                            <p className="text-slate-400 text-xs">@{user.username}</p>
                            {user.email && (
                              <p className="text-slate-500 text-xs">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                            roleColors[user.role] || roleColors.EMPLOYEE
                          }`}
                        >
                          <RoleIcon role={user.role} />
                          {user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            statusColors[user.status] || statusColors.ACTIVE
                          }`}
                        >
                          {user.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                          <span className="text-xs text-green-400">All Branches</span>
                        ) : user.branchAccess.length === 0 ? (
                          <span className="text-xs text-slate-500">No access</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.branchAccess.map((ba) => (
                              <span
                                key={ba.branchId}
                                className={`px-1.5 py-0.5 rounded text-xs border ${
                                  accessColors[ba.accessLevel]
                                }`}
                                title={`${ba.branchName}: ${ba.accessLevel === 'READ' ? 'View only' : ba.accessLevel === 'WRITE' ? 'View + Create/Edit' : 'Full Access (View + Create/Edit + Delete)'}`}
                              >
                                {ba.branchCode || ba.branchName?.slice(0, 8)} ({ba.accessLevel[0]})

                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {user.lastLogin
                          ? formatDateTime(user.lastLogin)
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {user.username !== 'sarkar' && currentUserRole === 'SUPER_ADMIN' && (
                            <>
                              {deleteConfirm === user.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    title="Confirm delete"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete User</h3>
                  <p className="text-sm text-slate-400">
                    Are you sure you want to delete <strong className="text-white">{users.find((u) => u.id === deleteConfirm)?.fullName}</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">
                  {editingUser ? `Edit User: ${editingUser.fullName}` : 'Create New User'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4" onKeyDown={handleEnterKeyNavigation}>
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, username: e.target.value }));
                        if (formErrors.username) setFormErrors((p) => { const n = {...p}; delete n.username; return n; });
                      }}
                      disabled={!!editingUser}
                      className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm disabled:opacity-50 focus:outline-none focus:border-blue-500 ${formErrors.username ? 'border-red-500' : 'border-slate-600/50'}`}
                      placeholder="Enter username"
                    />
                    {formErrors.username && <p className="text-xs text-red-400 mt-1">{formErrors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, password: e.target.value }));
                          if (formErrors.password) setFormErrors((p) => { const n = {...p}; delete n.password; return n; });
                        }}
                        className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm pr-10 focus:outline-none focus:border-blue-500 ${formErrors.password ? 'border-red-500' : 'border-slate-600/50'}`}
                        placeholder={editingUser ? 'New password' : 'Enter password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, fullName: e.target.value }));
                      if (formErrors.fullName) setFormErrors((p) => { const n = {...p}; delete n.fullName; return n; });
                    }}
                    className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-slate-600/50'}`}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, email: e.target.value }));
                        if (formErrors.email) setFormErrors((p) => { const n = {...p}; delete n.email; return n; });
                      }}
                      className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${formErrors.email ? 'border-red-500' : 'border-slate-600/50'}`}
                      placeholder="user@example.com"
                    />
                    {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone (optional)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, phone: e.target.value }));
                        if (formErrors.phone) setFormErrors((p) => { const n = {...p}; delete n.phone; return n; });
                      }}
                      className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${formErrors.phone ? 'border-red-500' : 'border-slate-600/50'}`}
                      placeholder="9876543210"
                    />
                    {formErrors.phone && <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                {/* Telegram Chat ID */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Telegram Chat ID <span className="text-slate-500">(for OTP login)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telegramChatId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, telegramChatId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 123456789"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    User must first message <a href="https://t.me/Pb_otpbot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@Pb_otpbot</a> on Telegram, then enter their chat ID here. Get it via <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@userinfobot</a>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, role: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editingUser && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, status: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Branch Access Section */}
                {formData.role !== 'SUPER_ADMIN' && formData.role !== 'ADMIN' && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="h-4 w-4 text-blue-400" />
                      <label className="text-sm font-medium text-white">Branch Access</label>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Select which branches this user can access and their permission level.
                      <br />
                      <strong>Read</strong> = View only &nbsp;|&nbsp; <strong>Write</strong> = View + Create/Edit &nbsp;|&nbsp; <strong>Full</strong> = View + Create/Edit + Delete
                    </p>

                    {branches.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">
                        No branches exist yet. Create branches first to assign access.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {branches.map((branch) => {
                          const access = formData.branchAccess.find(
                            (ba) => ba.branchId === branch.id,
                          );
                          const isChecked = !!access;

                          return (
                            <div
                              key={branch.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                isChecked
                                  ? 'bg-slate-700/30 border-blue-500/30'
                                  : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBranchAccess(branch.id)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-white font-medium">
                                  {branch.name}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">
                                  ({branch.code})
                                </span>
                              </div>
                              {isChecked && (
                                <div className="flex gap-1">
                                  {ACCESS_LEVELS.map((level) => (
                                    <button
                                      key={level}
                                      onClick={() => updateAccessLevel(branch.id, level)}
                                      className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                        access?.accessLevel === level
                                          ? accessColors[level]
                                          : 'bg-slate-700/30 text-slate-500 border-slate-600/30 hover:border-slate-500/50'
                                      }`}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(formData.role === 'SUPER_ADMIN' || formData.role === 'ADMIN') && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      <ShieldCheck className="h-4 w-4 inline mr-1" />
                      {formData.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} users automatically have full access to all branches.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formData.fullName ||
                    (!editingUser && (!formData.username || !formData.password))
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
