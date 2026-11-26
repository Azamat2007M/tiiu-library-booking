"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  AlertCircle,
  ShieldAlert,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";

export default function AdminsPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "librarian">("librarian");
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "librarian">("librarian");
  const [editError, setEditError] = useState<string | null>(null);

  const [passwordAdmin, setPasswordAdmin] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<User[]>("/admins");
      setAdmins(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || t.accessRestricted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);
    setCreateError(null);
    try {
      await api.post("/admins", {
        username: username.trim(),
        password,
        role,
      });
      setShowAddModal(false);
      setUsername("");
      setPassword("");
      setRole("librarian");
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (adm: User) => {
    setEditingAdmin(adm);
    setEditUsername(adm.username);
    setEditRole(adm.role);
    setEditError(null);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSubmitting(true);
    setEditError(null);
    try {
      await api.put(`/admins/${editingAdmin.id}`, {
        username: editUsername.trim(),
        role: editRole,
      });
      setEditingAdmin(null);
      setActionMessage({ type: "success", text: t.adminUpdatedSuccess });
      fetchAdmins();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const openPasswordModal = (adm: User) => {
    setPasswordAdmin(adm);
    setNewPassword("");
    setPasswordError(null);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordAdmin) return;
    setSubmitting(true);
    setPasswordError(null);
    try {
      await api.patch(`/admins/${passwordAdmin.id}/password`, {
        password: newPassword,
      });
      setPasswordAdmin(null);
      setNewPassword("");
      setActionMessage({ type: "success", text: t.passwordUpdatedSuccess });
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (adm: User) => {
    setDeletingAdmin(adm);
    setDeleteError(null);
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      await api.delete(`/admins/${deletingAdmin.id}`);
      setDeletingAdmin(null);
      setActionMessage({ type: "success", text: t.adminDeletedSuccess });
      fetchAdmins();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center max-w-lg mx-auto mt-12 space-y-3">
        <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-oak-900">{t.accessRestricted}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            {t.adminsTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.adminsSubtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          {t.createOperator}
        </button>
      </div>

      {actionMessage && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between shadow-sm ${
            actionMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-oak-400 hover:text-oak-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-paper-border bg-paper-card overflow-hidden shadow-paper">
        <table className="w-full text-left text-xs">
          <thead className="bg-paper-bg border-b border-paper-border text-oak-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">ID</th>
              <th className="py-3.5 px-4">{t.usernameLabel}</th>
              <th className="py-3.5 px-4">{t.roleLabel}</th>
              <th className="py-3.5 px-4">{t.createdAtLabel}</th>
              <th className="py-3.5 px-4">{t.accessLevelLabel}</th>
              <th className="py-3.5 px-4 text-right">{t.actionsLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-oak-400">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-oak-400">
                  Akkauntlar topilmadi.
                </td>
              </tr>
            ) : (
              admins.map((adm) => {
                const isSelf = adm.id === currentUser?.id;
                return (
                  <tr key={adm.id} className="hover:bg-paper-bg transition-colors">
                    <td className="py-3.5 px-4 font-mono text-oak-500">#{adm.id}</td>
                    <td className="py-3.5 px-4 font-bold text-oak-900">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                        <span>{adm.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          adm.role === "admin"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-oak-100 text-oak-700 border-oak-200"
                        }`}
                      >
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-oak-600 font-mono">
                      {new Date(adm.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {adm.role === "admin" ? (
                        <span className="text-[11px] text-amber-700 font-bold">{t.fullControl}</span>
                      ) : (
                        <span className="text-[11px] text-oak-500 font-medium">{t.borrowAndReturn}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openPasswordModal(adm)}
                          title={t.changePassword}
                          className="p-1.5 rounded-lg border border-paper-border bg-white text-oak-600 hover:text-amber-700 hover:border-amber-300 transition-colors"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(adm)}
                          title={t.edit}
                          className="p-1.5 rounded-lg border border-paper-border bg-white text-oak-600 hover:text-amber-700 hover:border-amber-300 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => openDeleteModal(adm)}
                            title={t.delete}
                            className="p-1.5 rounded-lg border border-paper-border bg-white text-oak-600 hover:text-red-600 hover:border-red-300 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.createOperator}</h3>
            {createError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.usernameLabel}</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masalan: kutubxonachi_azamat"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.passwordLabel}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordMinLengthHint}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.roleLabel}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "librarian")}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="librarian">{t.roleLibrarianLabel}</option>
                  <option value="admin">{t.roleAdminLabel}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-oak-200 bg-oak-100 text-xs font-bold text-oak-700 hover:bg-oak-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitting ? "..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.editAdmin}</h3>
            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.usernameLabel}</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.roleLabel}</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "admin" | "librarian")}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="librarian">{t.roleLibrarianLabel}</option>
                  <option value="admin">{t.roleAdminLabel}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 rounded-lg border border-oak-200 bg-oak-100 text-xs font-bold text-oak-700 hover:bg-oak-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitting ? "..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">
              {t.changePassword}: <span className="text-amber-700">{passwordAdmin.username}</span>
            </h3>
            {passwordError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.newPasswordLabel}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.passwordMinLengthHint}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordAdmin(null)}
                  className="px-4 py-2 rounded-lg border border-oak-200 bg-oak-100 text-xs font-bold text-oak-700 hover:bg-oak-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitting ? "..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.deleteAdmin}</h3>
            <p className="text-xs text-oak-600">
              {t.confirmDeleteAdmin} (<span className="font-bold text-oak-900">{deletingAdmin.username}</span>)
            </p>
            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                className="px-4 py-2 rounded-lg border border-oak-200 bg-oak-100 text-xs font-bold text-oak-700 hover:bg-oak-200"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "..." : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
