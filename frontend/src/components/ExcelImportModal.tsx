"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/books/import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Excel faylni yuklashda xatolik yuz berdi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-paper-border pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-oak-900">{t.importExcel}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-oak-400 hover:text-oak-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-oak-500 space-y-1">
          <p>Excel fayli 1-qatorida sarlavhalar bo'lishi kerak:</p>
          <div className="font-mono bg-paper-bg p-2 rounded-lg border border-paper-border text-oak-800">
            A ustun: Nomi (Title) | B ustun: Toifa ID (Category ID) | C ustun: Soni (Total Qty)
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1.5 text-emerald-800">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>Import muvaffaqiyatli bajarildi!</span>
            </div>
            <p>
              Jami: {result.total_rows} | Qo'shildi: {result.imported_count} | Xatolar: {result.failed_count}
            </p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-oak-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-paper-bg">
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer space-y-2 block">
              <Upload className="mx-auto h-8 w-8 text-amber-600" />
              <p className="text-xs font-semibold text-oak-700">
                {file ? file.name : "Faylni tanlash uchun bosing (.xlsx)"}
              </p>
              <p className="text-[10px] text-oak-400">Microsoft Excel ishchi kitoblari</p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-oak-200 bg-oak-100 text-xs font-bold text-oak-700 hover:bg-oak-200"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50"
            >
              {uploading ? "Yuklanmoqda..." : "Importni boshlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
