"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Borrowing, BorrowingCountsSummary, PaginatedResponse } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { CopyPhone } from "@/components/CopyPhone";
import { useLanguage } from "@/context/LanguageContext";
import {
  BookOpen,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function BorrowingsPage() {
  const { t } = useLanguage();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [counts, setCounts] = useState<BorrowingCountsSummary>({
    all: 0,
    active: 0,
    overdue: 0,
    returned_7d: 0,
    full_history: 0,
  });
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "overdue" | "returned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCounts = async () => {
    try {
      const res = await api.get<BorrowingCountsSummary>("/borrowings/counts");
      setCounts(res.data);
    } catch (err) {
      console.error("Error fetching borrowing counts:", err);
    }
  };

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        status_filter: statusFilter,
      };

      if (debouncedSearch) {
        params.q = debouncedSearch;
      }

      const res = await api.get<PaginatedResponse<Borrowing>>("/borrowings", { params });
      setBorrowings(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (err: any) {
      console.error("Error fetching borrowings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchBorrowings();
  }, [page, statusFilter, debouncedSearch]);

  const handleReturn = async (borrowingId: number) => {
    if (!confirm(t.confirmReturnMessage || t.confirmReturnPrompt)) {
      return;
    }

    setReturningId(borrowingId);
    setActionMessage(null);
    try {
      await api.post(`/borrowings/${borrowingId}/return`);
      setActionMessage({
        type: "success",
        text: t.returnSuccess,
      });
      fetchBorrowings();
      fetchCounts();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.detail || "Xatolik yuz berdi.",
      });
    } finally {
      setReturningId(null);
    }
  };

  const getStatusBadge = (borrowing: Borrowing) => {
    if (borrowing.status === "overdue") {
      const diffMs = Date.now() - new Date(borrowing.due_date).getTime();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const daysLabel = t.daysOverdueCount.replace("{days}", String(days));

      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
            {t.statusOverdue}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
            {daysLabel}
          </span>
        </div>
      );
    }

    if (borrowing.status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
          {t.statusActive}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
        {t.statusReturned}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            {t.borrowingsTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.borrowingsSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-paper-border pb-3">
        <button
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === "all"
              ? "bg-amber-500 text-oak-950 shadow-sm"
              : "bg-paper-card text-oak-600 border border-paper-border hover:bg-paper-bg"
          }`}
        >
          <span>{t.tabAll}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("active");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === "active"
              ? "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shadow-sm font-black"
              : "bg-paper-card text-oak-600 border border-paper-border hover:bg-paper-bg"
          }`}
        >
          <span>{t.tabActive}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D97706]/15 font-mono">
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("overdue");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === "overdue"
              ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] shadow-sm font-black"
              : "bg-paper-card text-oak-600 border border-paper-border hover:bg-paper-bg"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{t.tabOverdue}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DC2626]/15 font-mono">
            {counts.overdue}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("returned");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            statusFilter === "returned"
              ? "bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] shadow-sm font-black"
              : "bg-paper-card text-oak-600 border border-paper-border hover:bg-paper-bg"
          }`}
        >
          <span>{t.tabReturned7d}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#059669]/15 font-mono">
            {counts.returned_7d}
          </span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-oak-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchBorrowingsPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-paper-border bg-paper-card py-2 pl-9 pr-9 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:bg-white focus:outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-oak-400 hover:text-oak-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between animate-fadeIn shadow-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
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

      <div className="rounded-xl border border-paper-border bg-paper-card overflow-hidden shadow-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-bg border-b border-paper-border text-oak-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t.loanId}</th>
                <th className="py-3.5 px-4">{t.bookTitle}</th>
                <th className="py-3.5 px-4">{t.borrower}</th>
                <th className="py-3.5 px-4">{t.phone}</th>
                <th className="py-3.5 px-4">{t.issueDate}</th>
                <th className="py-3.5 px-4">{t.dueDate}</th>
                <th className="py-3.5 px-4">{t.status}</th>
                <th className="py-3.5 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      Yuklanmoqda...
                    </div>
                  </td>
                </tr>
              ) : borrowings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    Yozuvlar topilmadi.
                  </td>
                </tr>
              ) : (
                borrowings.map((b) => {
                  const isReturned = b.status === "returned";

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-paper-bg transition-colors ${
                        b.status === "overdue" ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-oak-500">#{b.id}</td>
                      <td className="py-3.5 px-4 font-bold text-oak-900 max-w-xs truncate" title={b.book_title}>
                        {b.book_title}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-oak-900">{b.borrower_name}</div>
                        <span className="text-[10px] uppercase text-oak-500 tracking-wider">
                          {b.borrower_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.borrower_phone ? (
                          <CopyPhone phone={b.borrower_phone} />
                        ) : (
                          <span className="text-oak-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-oak-600 font-mono">
                        {new Date(b.issue_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={b.status === "overdue" ? "text-red-600 font-bold" : "text-oak-700"}>
                          {new Date(b.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(b)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {isReturned ? (
                          <span className="text-[11px] text-oak-400 italic">{t.archived}</span>
                        ) : (
                          <button
                            onClick={() => handleReturn(b.id)}
                            disabled={returningId === b.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] hover:bg-[#A7F3D0] transition-all disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3 w-3 ${returningId === b.id ? "animate-spin" : ""}`} />
                            {t.returnAction}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
}
