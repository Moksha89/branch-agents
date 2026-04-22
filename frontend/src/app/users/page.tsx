'use client';

import { useEffect, useState, useCallback } from 'react';
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

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE' as string,
    status: 'ACTIVE' as string,
    branchAccess: [] as BranchAccessItem[],
  });

  const getToken = () => localStorage.getItem('accessToken') || '';

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users`, {
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
      const res = await fetch(`${API}/branches`, {
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
    setSaving(true);
    setError('');
    try {
      const url = editingUser ? `${API}/users/${editingUser.id}` : `${API}/users`;
      const method = editingUser ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
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
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete user');
      }
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
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
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
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
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            statusColors[user.status] || statusColors.ACTIVE
                          }`}
                        >
                          {user.status}
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
                                title={`${ba.branchName}: ${ba.accessLevel}`}
                              >
                                {ba.branchCode || ba.branchName?.slice(0, 8)} ({ba.accessLevel[0]})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
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
              <div className="px-6 py-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, username: e.target.value }))
                      }
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm disabled:opacity-50 focus:outline-none focus:border-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, password: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm pr-10 focus:outline-none focus:border-blue-500"
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone (optional)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="9876543210"
                    />
                  </div>
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
                          {r.replace('_', ' ')}
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
