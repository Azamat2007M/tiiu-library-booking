"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { BookOpen, CheckCircle2, AlertOctagon, Users, GraduationCap, BarChart3, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardSummary>("/dashboard/stats");
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oak-900">{t.operationsDashboard}</h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.dashboardSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-oak-200 bg-white text-oak-700 hover:bg-oak-100 transition-colors shadow-paper"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t.refreshData}
          </button>
          <Link
            href="/borrowings/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
          >
            {t.issueNewBook}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper">
          <div className="flex items-center justify-between text-oak-500">
            <span className="text-[11px] uppercase font-bold tracking-wider">{t.totalBooks}</span>
            <BookOpen className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-oak-900">{data?.total_books ?? 0}</span>
            <span className="text-xs text-oak-500">{t.copiesAcrossShelves}</span>
          </div>
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper">
          <div className="flex items-center justify-between text-oak-500">
            <span className="text-[11px] uppercase font-bold tracking-wider">{t.availableInLibrary}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{data?.total_available ?? 0}</span>
            <span className="text-xs text-oak-500">{t.readyForCheckout}</span>
          </div>
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper">
          <div className="flex items-center justify-between text-oak-500">
            <span className="text-[11px] uppercase font-bold tracking-wider">{t.activeBorrowed}</span>
            <BarChart3 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{data?.total_borrowed ?? 0}</span>
            <span className="text-xs text-oak-500">{t.inCirculation}</span>
          </div>
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper">
          <div className="flex items-center justify-between text-oak-500">
            <span className="text-[11px] uppercase font-bold tracking-wider">{t.overdueIssues}</span>
            <AlertOctagon className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{data?.total_overdue ?? 0}</span>
            <span className="text-xs text-red-500 font-medium">{t.past14Days}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper-card p-6 shadow-paper space-y-5">
        <div className="flex items-center justify-between border-b border-paper-border pb-4">
          <div>
            <h2 className="text-base font-bold text-oak-900">{t.categoryDistribution}</h2>
            <p className="text-xs text-oak-500 mt-0.5">
              {t.categoryDistSubtitle}
            </p>
          </div>
          <span className="text-xs text-oak-500 font-mono">
            {data?.categories.length || 0} toifa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.categories.map((cat) => {
            const availPercentage =
              cat.total_qty > 0 ? Math.round((cat.available_qty / cat.total_qty) * 100) : 0;

            return (
              <div
                key={cat.category_id}
                className="rounded-lg border border-paper-border bg-paper-bg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-oak-900 truncate" title={cat.category_name}>
                    {cat.category_name}
                  </h3>
                  <span className="text-xs font-mono font-medium text-oak-500">{cat.total_qty} jami</span>
                </div>

                <div className="w-full bg-oak-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${availPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-paper-border">
                  <span className="text-emerald-700 font-semibold">
                    {cat.available_qty} {t.availableUnits}
                  </span>
                  <span className="text-oak-400">/</span>
                  <span className="text-amber-700 font-semibold">
                    {cat.borrowed_qty} {t.borrowedUnits}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-oak-500">{t.enrolledStudents}</p>
              <p className="text-xl font-bold text-oak-900 mt-0.5">{data?.total_students ?? 0}</p>
            </div>
          </div>
          <Link
            href="/students"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
          >
            {t.viewStudentDirectory}
          </Link>
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-5 shadow-paper flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-oak-100 text-oak-700 border border-oak-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-oak-500">{t.registeredStaff}</p>
              <p className="text-xl font-bold text-oak-900 mt-0.5">{data?.total_staff ?? 0}</p>
            </div>
          </div>
          <Link
            href="/staff"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
          >
            {t.viewStaffDirectory}
          </Link>
        </div>
      </div>
    </div>
  );
}
