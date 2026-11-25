"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const { t } = useLanguage();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-paper-border bg-paper-card px-4 py-3 sm:px-6 rounded-b-xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="relative inline-flex items-center rounded-lg border border-oak-200 bg-oak-100 px-3 py-1.5 text-xs font-semibold text-oak-700 hover:bg-oak-200 disabled:opacity-40"
        >
          {t.previous}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="relative ml-3 inline-flex items-center rounded-lg border border-oak-200 bg-oak-100 px-3 py-1.5 text-xs font-semibold text-oak-700 hover:bg-oak-200 disabled:opacity-40"
        >
          {t.next}
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-oak-500">
            {t.showingResults} <span className="font-semibold text-oak-900">{startItem}</span> -{" "}
            <span className="font-semibold text-oak-900">{endItem}</span> /{" "}
            <span className="font-semibold text-oak-900">{totalItems}</span> (10 / {t.pageOf.toLowerCase()})
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="relative inline-flex items-center rounded-l-lg px-2.5 py-1.5 text-oak-600 ring-1 ring-inset ring-paper-border hover:bg-oak-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="relative inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-oak-800 ring-1 ring-inset ring-paper-border bg-paper-bg">
              {t.pageOf} {currentPage} / {totalPages || 1}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="relative inline-flex items-center rounded-r-lg px-2.5 py-1.5 text-oak-600 ring-1 ring-inset ring-paper-border hover:bg-oak-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
