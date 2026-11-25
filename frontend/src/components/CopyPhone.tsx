"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CopyPhoneProps {
  phone?: string | null;
  className?: string;
}

export function CopyPhone({ phone, className = "" }: CopyPhoneProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  if (!phone) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title={t.clickToCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
        copied
          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
          : "bg-paper-bg text-oak-700 hover:text-oak-950 hover:bg-oak-100 border border-paper-border"
      } ${className}`}
    >
      <span>{phone}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-oak-400" />}
    </button>
  );
}
