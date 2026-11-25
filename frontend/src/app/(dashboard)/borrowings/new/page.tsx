"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Category, BookDropdownItem, Student } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { useDebouncedSearch } from "@/lib/useDebouncedSearch";
import {
  BookmarkPlus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  BookOpen,
  X,
  Plus,
  BookMarked,
  Info,
} from "lucide-react";

export default function NewBorrowingPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [inlinePhone, setInlinePhone] = useState("");

  const [selectedBooks, setSelectedBooks] = useState<BookDropdownItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 14);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get<Category[]>("/books/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const {
    query: studentQuery,
    setQuery: setStudentQuery,
    results: studentResults,
    loading: studentLoading,
    clear: clearStudentSearch,
  } = useDebouncedSearch<Student>({
    searchFn: async (queryStr, signal) => {
      const res = await api.get<Student[]>("/students/search", {
        params: { q: queryStr, limit: 10 },
        signal,
      });
      return res.data;
    },
    delay: 350,
    minChars: 2,
  });

  const {
    query: bookQuery,
    setQuery: setBookQuery,
    results: bookResults,
    loading: bookLoading,
    clear: clearBookSearch,
  } = useDebouncedSearch<BookDropdownItem>({
    searchFn: async (queryStr, signal) => {
      const res = await api.get<BookDropdownItem[]>("/books/search", {
        params: {
          q: queryStr,
          category_id: selectedCategoryId || undefined,
          limit: 10,
        },
        signal,
      });
      return res.data;
    },
    delay: 350,
    minChars: 2,
  });

  const handleAddBook = (book: BookDropdownItem) => {
    if (selectedBooks.length >= 5) {
      setError(t.maxBooksLimitNotice);
      return;
    }
    if (selectedBooks.some((b) => b.id === book.id)) {
      setError(t.bookAlreadyInCart);
      return;
    }
    if (book.available_qty <= 0) {
      setError(t.outOfStock);
      return;
    }

    setError(null);
    setSelectedBooks((prev) => [...prev, book]);
    clearBookSearch();
  };

  const handleRemoveBook = (bookId: number) => {
    setSelectedBooks((prev) => prev.filter((b) => b.id !== bookId));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedStudent) {
      setError("Iltimos, talabani tanlang.");
      return;
    }

    if (selectedBooks.length === 0) {
      setError(t.cartEmptyNotice);
      return;
    }

    if (selectedBooks.length > 5) {
      setError(t.maxBooksLimitNotice);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/borrowings/batch", {
        student_id: selectedStudent.id,
        phone: inlinePhone.trim() || undefined,
        book_ids: selectedBooks.map((b) => b.id),
      });

      setSuccess(t.issueBooksSuccess);
      setTimeout(() => {
        router.push("/borrowings");
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Kitob berishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-paper-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-amber-600" />
            {t.issueBookTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.issueBookSubtitle}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-paper-border bg-paper-card p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-oak-700 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-oak-950 font-bold">
                1
              </span>
              {t.borrowerSelection}
            </h2>
            {selectedStudent && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setInlinePhone("");
                  clearStudentSearch();
                }}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
              >
                {t.change}
              </button>
            )}
          </div>

          {selectedStudent ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-sm">
                    {selectedStudent.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-oak-900">{selectedStudent.full_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-oak-600">
                      {selectedStudent.group_name && (
                        <span className="px-2 py-0.5 rounded bg-white border border-amber-200 font-semibold text-[11px] text-oak-800">
                          {selectedStudent.group_name}
                        </span>
                      )}
                      {selectedStudent.course_name && (
                        <span className="text-oak-500 font-medium text-[11px]">
                          • {selectedStudent.course_name}
                        </span>
                      )}
                      {selectedStudent.specialty_name && (
                        <span className="text-oak-500 truncate max-w-xs text-[11px]">
                          • {selectedStudent.specialty_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStudent.phone ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white text-oak-800 border border-amber-200">
                      <Phone className="h-3 w-3 text-amber-600" />
                      {selectedStudent.phone}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md border border-amber-300">
                      {t.phoneNotEntered}
                    </span>
                  )}
                </div>
              </div>

              {!selectedStudent.phone && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2.5 shadow-sm transition-all animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>{t.studentPhoneMissingHighlight}</span>
                  </div>
                  <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative w-full">
                      <Phone className="h-3.5 w-3.5 text-oak-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={inlinePhone}
                        onChange={(e) => setInlinePhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full rounded-lg border border-amber-300 bg-white py-1.5 pl-8 pr-3 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:outline-none shadow-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-700">
                    * {t.phoneSaveNote}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="h-4 w-4 text-oak-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t.searchStudentPlaceholder}
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 pl-9 pr-10 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
                {studentLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  </div>
                )}
              </div>

              {studentQuery.trim().length >= 2 && (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-paper-border bg-white shadow-card divide-y divide-paper-border">
                  {studentLoading ? (
                    <div className="p-3 text-xs text-center text-oak-400">Qidirilmoqda...</div>
                  ) : studentResults.length === 0 ? (
                    <div className="p-3 text-xs text-center text-oak-400">
                      Bunday talaba topilmadi
                    </div>
                  ) : (
                    studentResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s);
                          setInlinePhone("");
                          clearStudentSearch();
                        }}
                        className="p-3 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-oak-900">{s.full_name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-oak-500 mt-0.5">
                            {s.group_name && (
                              <span className="font-semibold text-oak-700 bg-oak-100 px-1.5 py-0.5 rounded text-[10px]">
                                {s.group_name}
                              </span>
                            )}
                            {s.course_name && <span>{s.course_name}</span>}
                            {s.specialty_name && <span className="truncate max-w-xs">• {s.specialty_name}</span>}
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          {s.phone ? (
                            <span className="text-xs font-mono text-oak-600">{s.phone}</span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              {t.phoneNotEntered}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-oak-700 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-oak-950 font-bold">
                2
              </span>
              {t.selectedBooksCart}
            </h2>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                selectedBooks.length === 5
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : selectedBooks.length > 0
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-paper-bg text-oak-500 border-paper-border"
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" />
              {t.selectedBooksCount}: {selectedBooks.length} / 5
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-oak-700 mb-1.5">
                {t.categoryFilter}
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none"
              >
                <option value="">{t.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 relative">
              <label className="block text-xs font-semibold text-oak-700 mb-1.5">
                {t.bookTitleSearch}
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-oak-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={
                    selectedBooks.length >= 5
                      ? t.maxBooksLimitNotice
                      : t.bookSearchPlaceholder
                  }
                  disabled={selectedBooks.length >= 5}
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 pl-9 pr-10 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:bg-white focus:outline-none disabled:bg-oak-100 disabled:cursor-not-allowed"
                />
                {bookLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  </div>
                )}
              </div>

              {bookQuery.trim().length >= 2 && selectedBooks.length < 5 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-paper-border bg-white shadow-card overflow-hidden divide-y divide-paper-border">
                  {bookLoading ? (
                    <div className="p-3 text-xs text-center text-oak-400">Qidirilmoqda...</div>
                  ) : bookResults.length === 0 ? (
                    <div className="p-3 text-xs text-center text-oak-400">Kitob topilmadi</div>
                  ) : (
                    bookResults.map((b) => {
                      const isOutOfStock = b.available_qty <= 0;
                      const isAlreadyInCart = selectedBooks.some((item) => item.id === b.id);

                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (!isOutOfStock && !isAlreadyInCart) {
                              handleAddBook(b);
                            }
                          }}
                          className={`p-3 flex items-center justify-between text-xs transition-colors ${
                            isOutOfStock || isAlreadyInCart
                              ? "bg-oak-50 text-oak-400 cursor-not-allowed opacity-60"
                              : "hover:bg-amber-50/50 cursor-pointer text-oak-900"
                          }`}
                        >
                          <div className="truncate pr-3">
                            <p className="font-bold truncate">{b.title}</p>
                            <span className="text-[10px] text-oak-500">
                              ID #{b.id} {b.category_name && `• ${b.category_name}`}
                            </span>
                          </div>

                          <div className="flex-shrink-0 text-right">
                            {isAlreadyInCart ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Tanlangan
                              </span>
                            ) : isOutOfStock ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                {t.outOfStock}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Plus className="h-3 w-3" />
                                {b.available_qty} {t.available}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedBooks.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-oak-800 uppercase tracking-wider">
                {t.selectedBooksCart} ({selectedBooks.length}):
              </p>
              <div className="divide-y divide-paper-border rounded-xl border border-paper-border bg-paper-bg overflow-hidden shadow-sm">
                {selectedBooks.map((book, idx) => (
                  <div
                    key={book.id}
                    className="p-3 flex items-center justify-between hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-oak-900">{book.title}</p>
                        <p className="text-[11px] text-oak-500">
                          ID #{book.id} {book.category_name && `• ${book.category_name}`} • {book.available_qty} nusxa mavjud
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBook(book.id)}
                      className="p-1.5 rounded-lg text-oak-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t.removeBook}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl border border-dashed border-paper-border bg-paper-bg text-oak-400 text-xs">
              <BookOpen className="h-6 w-6 mx-auto mb-1.5 text-oak-300" />
              <span>Hozircha kitob tanlanmagan. Yuqoridagi qidiruv orqali 5 tagacha kitob tanlang.</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-paper-border bg-paper-card p-6 shadow-paper space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-oak-700 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-oak-950 font-bold">
              3
            </span>
            {t.loanTerms}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-paper-bg border border-paper-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-oak-600">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span>{t.issueDateToday}</span>
              </div>
              <span className="font-mono font-bold text-oak-900">
                {today.toISOString().split("T")[0]}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-paper-bg border border-paper-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-oak-600">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>{t.automaticReturnDate}</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {dueDate.toISOString().split("T")[0]}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-oak-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              <span>Har bir kitob uchun 14 kunlik muddat belgilanadi.</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedStudent || selectedBooks.length === 0}
              className="px-6 py-2.5 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 shadow-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-oak-950 border-t-transparent" />
                  {t.batchIssuingBooks}
                </>
              ) : (
                `${t.batchIssueButton} (${selectedBooks.length})`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
