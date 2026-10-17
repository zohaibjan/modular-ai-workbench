import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Check, Loader2,
  ShieldCheck, User, Eye, EyeOff, LayoutGrid,
} from 'lucide-react';

const ALL_APPS = [
  { id: 'ats', label: 'ATS Shortlisting' },
  { id: 'abi', label: 'Multimodal Report Studio' },
  { id: 'tsf', label: 'Smith Family Donations' },
  { id: 'ama', label: 'AI Migration Assistant' },
];

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ children, variant = 'default' }) {
  const styles = {
    admin: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    user: 'bg-slate-100 text-slate-600 border border-slate-200',
    active: 'bg-green-100 text-green-700 border border-green-200',
    inactive: 'bg-red-100 text-red-600 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant] || ''}`}>
      {children}
    </span>
  );
}

function AppCheckboxes({ selected, onChange }) {
  const isAll = selected === null;

  function toggleAll() {
    onChange(isAll ? [] : null);
  }

  function toggleApp(id) {
    if (isAll) {
      onChange(ALL_APPS.filter((a) => a.id !== id).map((a) => a.id));
    } else if (selected.includes(id)) {
      onChange(selected.filter((a) => a !== id));
    } else {
      const next = [...selected, id];
      onChange(next.length === ALL_APPS.length ? null : next);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isAll}
          onChange={toggleAll}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-slate-700">All apps (unrestricted)</span>
      </label>
      <div className="ml-1 space-y-1.5 pl-4 border-l-2 border-slate-100">
        {ALL_APPS.map((app) => (
          <label key={app.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAll || (selected || []).includes(app.id)}
              onChange={() => toggleApp(app.id)}
              disabled={isAll}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
            />
            <span className={`text-sm ${isAll ? 'text-slate-400' : 'text-slate-600'}`}>{app.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState(user?.role || 'user');
  const [allowedApps, setAllowedApps] = useState(user?.allowed_apps ?? null);
  const [isActive, setIsActive] = useState(user?.is_active !== 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const body = { role, is_active: isActive };
        if (username !== user.username) body.username = username;
        if (password) body.password = password;
        if (allowedApps === null) {
          body.clear_app_restriction = true;
        } else {
          body.allowed_apps = allowedApps;
        }
        await apiFetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role, allowed_apps: allowedApps }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit User' : 'New User'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {isEdit ? 'New password (leave blank to keep current)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'min. 6 characters'}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <div className="flex gap-2">
              {['user', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    role === r
                      ? r === 'admin'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {r === 'admin' ? <ShieldCheck size={14} /> : <User size={14} />}
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* App access */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">App access</label>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <AppCheckboxes selected={allowedApps} onChange={setAllowedApps} />
            </div>
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-700">{isActive ? 'Active' : 'Disabled'}</span>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !username || (!isEdit && !password)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | user object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleDelete(user) {
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function appLabel(allowedApps) {
    if (allowedApps === null) return 'All apps';
    if (allowedApps.length === 0) return 'No apps';
    return allowedApps
      .map((id) => ALL_APPS.find((a) => a.id === id)?.label || id)
      .join(', ');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">User</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">App access</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.username}</p>
                        <p className="text-xs text-slate-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.role}>
                      {u.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <LayoutGrid size={13} className="text-slate-400 shrink-0" />
                      <span className="text-xs">{appLabel(u.allowed_apps)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.is_active ? 'active' : 'inactive'}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadUsers(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Delete user?</h2>
            <p className="text-sm text-slate-500 mb-6">
              <strong>{deleteTarget.username}</strong> will be permanently removed and will lose all access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
