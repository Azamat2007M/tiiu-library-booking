"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { StaffMember, PaginatedResponse } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { CopyPhone } from "@/components/CopyPhone";
import { useLanguage } from "@/context/LanguageContext";
import { Users, Search, AlertOctagon, TrendingUp, UserPlus } from "lucide-react";

export default function StaffPage() {
  const { t } = useLanguage();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [debtorsOnly, setDebtorsOnly] = useState(false);
  const [mostActive, setMostActive] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<StaffMember>>("/users/staff", {
        params: {
          page,
          q: searchQuery.trim() || undefined,
          debtors_only: debtorsOnly,
          most_active: mostActive,
        },
      });
      setStaffList(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, searchQuery, debtorsOnly, mostActive]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await api.post("/users/staff", {
        full_name: fullName.trim(),
        department: department.trim(),
        phone: phone.trim(),
      });
      setShowAddModal(false);
      setFullName("");
      setDepartment("");
      setPhone("");
      fetchStaff();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            {t.staffTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.staffSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-oak-950 hover:bg-amber-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          {t.registerStaff}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-oak-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-paper-border bg-paper-card py-2 pl-9 pr-3 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:outline-none shadow-paper"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setDebtorsOnly(!debtorsOnly);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              debtorsOnly
                ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA] shadow-sm"
                : "bg-paper-card text-oak-600 border-paper-border hover:bg-oak-100 shadow-paper"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
            {t.debtorsOnly}
          </button>

          <button
            onClick={() => {
              setMostActive(!mostActive);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              mostActive
                ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                : "bg-paper-card text-oak-600 border-paper-border hover:bg-oak-100 shadow-paper"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            {t.mostActive}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper-card overflow-hidden shadow-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-bg border-b border-paper-border text-oak-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">{t.borrower}</th>
                <th className="py-3.5 px-4">{t.department}</th>
                <th className="py-3.5 px-4">{t.phone}</th>
                <th className="py-3.5 px-4 text-center">{t.activeLoans}</th>
                <th className="py-3.5 px-4 text-center">{t.totalBorrows}</th>
                <th className="py-3.5 px-4 text-right">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-oak-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-oak-400">
                    Xodimlar topilmadi.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-paper-bg transition-colors ${
                      member.has_overdue ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-oak-500">#{member.id}</td>
                    <td className="py-3.5 px-4 font-bold text-oak-900">{member.full_name}</td>
                    <td className="py-3.5 px-4 text-oak-700">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-oak-100 font-medium">
                        {member.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <CopyPhone phone={member.phone} />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-oak-800">
                      {member.active_borrows_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">
                      {member.borrow_count}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.has_overdue ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                          {t.overdueDebtor}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">
                          {t.goodStanding}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
          loading={loading}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.registerStaff}</h3>
            {createError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">F.I.SH.</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="masalan: Prof. Karim Berdiev"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.department}</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="masalan: Falsafa kafedrasi"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 91 987 65 43"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
                />
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
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
