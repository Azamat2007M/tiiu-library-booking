"use client";

import React, { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "amber" | "emerald" | "danger";
  isLoading?: boolean;
  contextBadge?: {
    primary: string;
    secondary?: string;
  } | null;
  error?: string | null;
}

const VARIANT_STYLES = {
  amber: {
    iconBg: "bg-amber-50 border-amber-200 text-amber-600",
    button: "bg-[#F59E0B] hover:bg-amber-600 text-[#1C1917]",
    Icon: AlertCircle,
  },
  emerald: {
    iconBg: "bg-emerald-50 border-emerald-200 text-[#059669]",
    button: "bg-[#059669] hover:bg-emerald-700 text-white",
    Icon: CheckCircle2,
  },
  danger: {
    iconBg: "bg-red-50 border-red-200 text-[#DC2626]",
    button: "bg-[#DC2626] hover:bg-red-700 text-white",
    Icon: AlertTriangle,
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "amber",
  isLoading = false,
  contextBadge = null,
  error = null,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const style = VARIANT_STYLES[variant];
  const IconComponent = style.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-[2px] p-4 transition-opacity"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[#EFEAE1] bg-white p-6 shadow-xl space-y-4 transform transition-all animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917]">{title}</h3>
              <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="p-1 rounded-lg text-oak-400 hover:text-oak-700 hover:bg-paper-bg transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {contextBadge && (
          <div className="rounded-xl border border-[#EFEAE1] bg-[#FDFBF7] px-3.5 py-2.5 space-y-0.5">
            <div className="text-xs font-bold text-[#1C1917] truncate">{contextBadge.primary}</div>
            {contextBadge.secondary && (
              <div className="text-[11px] text-[#57534E] truncate">{contextBadge.secondary}</div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#EFEAE1]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#EFEAE1] bg-[#FDFBF7] text-xs font-bold text-[#57534E] hover:bg-oak-100 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60 ${style.button}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
