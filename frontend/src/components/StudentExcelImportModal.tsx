"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { StudentImportSummary } from "@/lib/types";
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface StudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentExcelImportModal({ isOpen, onClose, onSuccess }: StudentExcelImportModalProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<StudentImportSummary | null>(null);
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
      const res = await api.post<StudentImportSummary>("/students/import-excel", formData, {
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

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-paper-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-oak-900">{t.importExcelStudents}</h3>
              <p className="text-[11px] text-oak-500">Talabalar bazasini .xlsx fayl orqali ommaviy yuklash</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md text-oak-400 hover:text-oak-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>{t.excelStudentsRequiredCols}</span>
          </div>
          <div className="font-mono text-[11px] bg-white/90 p-2.5 rounded-lg border border-amber-200 text-oak-800 overflow-x-auto whitespace-nowrap">
            Full Name | Birth Date | Phone | Education Type | Education Form | Specialty | Course | Group
          </div>
          <p className="text-[10px] text-oak-500">
            * Yangi ta&apos;lim turlari, shakllari, kurslar va guruhlar avtomatik yaratiladi. Mavjud talabalar (F.I.Sh + Tug&apos;ilgan sana) bo&apos;yicha yangilanadi.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-2.5 text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span>Import muvaffaqiyatli yakunlandi!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
              <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] uppercase text-oak-500 block font-sans">{t.statsProcessed}</span>
                <strong className="text-sm text-oak-900">{result.processed}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] uppercase text-emerald-600 block font-sans">{t.statsAdded}</span>
                <strong className="text-sm text-emerald-700">+{result.added}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] uppercase text-amber-600 block font-sans">{t.statsUpdated}</span>
                <strong className="text-sm text-amber-700">{result.updated}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] uppercase text-red-500 block font-sans">{t.statsFailed}</span>
                <strong className="text-sm text-red-600">{result.failed}</strong>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-[11px] text-red-700 bg-white p-2.5 rounded-lg border border-red-200 space-y-1 max-h-32 overflow-y-auto">
                <p className="font-bold">Xatolik yuz bergan qatorlar:</p>
                {result.errors.slice(0, 10).map((err, i) => (
                  <p key={i}>
                    • Qator {err.row_number}: {err.reason}
                  </p>
                ))}
                {result.errors.length > 10 && (
                  <p className="text-[10px] text-oak-400">... va yana {result.errors.length - 10} ta xato</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-oak-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-paper-bg">
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="student-excel-file-input"
            />
            <label htmlFor="student-excel-file-input" className="cursor-pointer space-y-2 block">
              <Upload className="mx-auto h-8 w-8 text-amber-600" />
              <p className="text-xs font-semibold text-oak-700">
                {file ? file.name : "Faylni tanlash uchun bosing (.xlsx, .xlsm)"}
              </p>
              <p className="text-[10px] text-oak-400">Microsoft Excel ishchi kitobi (masalan: talabalar_toliq_import.xlsx)</p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-paper-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              {uploading ? "Import qilinmoqda..." : "Importni boshlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
