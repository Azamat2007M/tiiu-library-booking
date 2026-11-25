"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/locales/dictionaries";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-oak-800 text-oak-300 hover:text-amber-400 hover:bg-oak-850 border border-oak-700/60 transition-colors"
          title={`Language: ${current.label}`}
        >
          <span className="text-xs font-bold font-mono">{current.code.toUpperCase()}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-oak-800/80 text-oak-300 hover:text-white hover:bg-oak-750 border border-oak-700/60 text-xs font-medium transition-colors w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <span>{current.flag}</span>
            <span className="truncate">{current.label}</span>
          </div>
          <Globe className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute bottom-full mb-2 z-40 w-36 rounded-lg bg-oak-900 border border-oak-700 p-1 shadow-xl ${
              compact ? "left-0" : "left-0 right-0 w-full"
            }`}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  language === lang.code
                    ? "bg-amber-500/20 text-amber-400 font-semibold"
                    : "text-oak-300 hover:text-white hover:bg-oak-800"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
