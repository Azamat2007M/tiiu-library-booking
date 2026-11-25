"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Book, Category, PaginatedResponse } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { ExcelImportModal } from "@/components/ExcelImportModal";
import { useLanguage } from "@/context/LanguageContext";
import {
  Library,
  Plus,
  Search,
  FileSpreadsheet,
  FolderPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

export default function BooksPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCatId, setNewCatId] = useState<number | "">("");
  const [newQty, setNewQty] = useState(1);
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCatId, setEditCatId] = useState<number | "">("");
  const [editTotalQty, setEditTotalQty] = useState(1);
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>("/books/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Book>>("/books", {
        params: {
          page,
          q: searchQuery || undefined,
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
        },
      });
      setBooks(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, searchQuery, selectedCategory]);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCatId) return;

    try {
      await api.post("/books", {
        title: newTitle.trim(),
        category_id: Number(newCatId),
        total_qty: Number(newQty),
      });
      setShowAddModal(false);
      setNewTitle("");
      setNewQty(1);
      fetchBooks();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.post("/books/categories", { name: newCatName.trim() });
      setNewCatName("");
      setShowAddCat(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditCatId(book.category_id);
    setEditTotalQty(book.total_qty);
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !editTitle.trim() || !editCatId) return;

    const currentlyLoaned = editingBook.total_qty - editingBook.available_qty;
    if (editTotalQty < currentlyLoaned) {
      setEditError(`${t.minStockRequired} (${currentlyLoaned})`);
      return;
    }

    setIsSubmittingEdit(true);
    setEditError("");
    try {
      await api.put(`/books/${editingBook.id}`, {
        title: editTitle.trim(),
        category_id: Number(editCatId),
        total_qty: Number(editTotalQty),
      });
      setShowEditModal(false);
      setEditingBook(null);
      fetchBooks();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Kitobni yangilashda xatolik yuz berdi.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const openDeleteModal = (book: Book) => {
    setDeletingBook(book);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/books/${deletingBook.id}`);
      setShowDeleteModal(false);
      setDeletingBook(null);
      fetchBooks();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || t.deleteErrorHasLoans);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <Library className="h-5 w-5 text-amber-600" />
            {t.bookCatalogTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.bookCatalogSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExcelOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-paper-border bg-white text-emerald-700 hover:bg-emerald-50 transition-colors shadow-paper"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t.importExcel}
          </button>
          <button
            onClick={() => setShowAddCat(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-oak-200 bg-white text-oak-700 hover:bg-oak-100 transition-colors shadow-paper"
          >
            <FolderPlus className="h-4 w-4" />
            {t.addCategory}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t.addBook}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
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

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-paper-border bg-paper-card py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:outline-none shadow-paper"
          >
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper-card overflow-hidden shadow-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-bg border-b border-paper-border text-oak-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">{t.bookTitle}</th>
                <th className="py-3.5 px-4">{t.categoryFilter}</th>
                <th className="py-3.5 px-4 text-center">{t.totalStock}</th>
                <th className="py-3.5 px-4 text-center">{t.available}</th>
                <th className="py-3.5 px-4 text-center">{t.loanedOut}</th>
                <th className="py-3.5 px-4 text-center">{t.status}</th>
                <th className="py-3.5 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    Kitoblar topilmadi.
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const loaned = book.total_qty - book.available_qty;
                  const isOutOfStock = book.available_qty === 0;

                  return (
                    <tr key={book.id} className="hover:bg-paper-bg transition-colors">
                      <td className="py-3.5 px-4 font-mono text-oak-500">#{book.id}</td>
                      <td className="py-3.5 px-4 font-bold text-oak-900">{book.title}</td>
                      <td className="py-3.5 px-4 text-oak-700">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-oak-100 text-oak-700 font-medium">
                          {book.category_name || "Umumiy"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-oak-800">
                        {book.total_qty}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {book.available_qty}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-oak-500">
                        {loaned}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                            {t.outOfStock}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">
                            {t.available}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEditModal(book)}
                            title={t.edit}
                            className="p-1.5 rounded-lg border border-paper-border bg-white text-oak-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-colors shadow-paper"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(book)}
                            title={t.delete}
                            className="p-1.5 rounded-lg border border-paper-border bg-white text-oak-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-paper"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

      <ExcelImportModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onSuccess={() => {
          fetchBooks();
          fetchCategories();
        }}
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.addBook}</h3>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.bookTitle}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.bookTitlePlaceholder}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.categoryFilter}</label>
                <select
                  required
                  value={newCatId}
                  onChange={(e) => setNewCatId(Number(e.target.value))}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                >
                  <option value="">{t.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.totalQtyLabel}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-paper-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <div className="border-b border-paper-border pb-3">
              <h3 className="text-base font-bold text-oak-900">{t.editBook}</h3>
              <p className="text-xs text-oak-500 mt-0.5">
                ID #{editingBook.id} — {editingBook.title}
              </p>
            </div>

            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.bookTitle} <span className="text-amber-600">*</span></label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">{t.categoryFilter} <span className="text-amber-600">*</span></label>
                <select
                  required
                  value={editCatId}
                  onChange={(e) => setEditCatId(Number(e.target.value))}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                >
                  <option value="">{t.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-oak-700">{t.totalQtyLabel} <span className="text-amber-600">*</span></label>
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {t.currentlyLoaned}: {editingBook.total_qty - editingBook.available_qty}
                  </span>
                </div>
                <input
                  type="number"
                  min={Math.max(1, editingBook.total_qty - editingBook.available_qty)}
                  required
                  value={editTotalQty}
                  onChange={(e) => setEditTotalQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>

              {editError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-paper-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBook(null);
                    setEditError("");
                  }}
                  className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmittingEdit ? "Saqlanmoqda..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-oak-900">{t.deleteBook}</h3>
                <p className="text-xs text-oak-500 font-medium">#{deletingBook.id} — {deletingBook.title}</p>
              </div>
            </div>

            <p className="text-xs text-oak-600 leading-relaxed">
              {t.confirmDeleteBook}
            </p>

            {deletingBook.total_qty - deletingBook.available_qty > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>
                  {t.currentlyLoaned}: {deletingBook.total_qty - deletingBook.available_qty} ta kitob
                </span>
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-paper-border">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingBook(null);
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isDeleting ? "O'chirilmoqda..." : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-oak-900">{t.addCategory}</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">Toifa nomi</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="masalan: Falsafaga oid, Badiiy"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-paper-border">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
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
