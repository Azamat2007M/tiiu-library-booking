"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, X, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface ComboboxOption {
  id: number;
  name: string;
}

interface SearchableComboboxProps {
  label: string;
  options: ComboboxOption[];
  selectedId: number | null;
  customValue: string;
  onChange: (id: number | null, customVal: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SearchableCombobox({
  label,
  options,
  selectedId,
  customValue,
  onChange,
  placeholder,
  required = false,
}: SearchableComboboxProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.id === selectedId);
  const displayValue = selectedOption ? selectedOption.name : customValue;

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const isExactMatch = options.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleSelectOption = (option: ComboboxOption) => {
    onChange(option.id, "");
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (search.trim()) {
      onChange(null, search.trim());
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, "");
    setSearch("");
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-semibold text-oak-700">
        {label} {required && <span className="text-amber-600">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between rounded-lg border py-2 px-3 text-xs text-left transition-colors shadow-paper ${
            isOpen
              ? "border-amber-500 bg-white ring-1 ring-amber-500"
              : "border-paper-border bg-paper-bg hover:bg-white"
          }`}
        >
          <span
            className={`truncate ${
              displayValue ? "text-oak-900 font-medium" : "text-oak-400"
            }`}
          >
            {displayValue || placeholder || t.searchOrAdd}
            {customValue && !selectedOption && (
              <span className="ml-1.5 text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                yangi
              </span>
            )}
          </span>

          <div className="flex items-center gap-1 ml-2 text-oak-400">
            {displayValue && (
              <span
                onClick={handleClear}
                className="hover:text-red-500 p-0.5 cursor-pointer rounded"
                title="Tozalash"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                isOpen ? "rotate-180 text-amber-600" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-paper-border bg-white shadow-card overflow-hidden">
            <div className="p-2 border-b border-paper-border bg-paper-bg">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-oak-400 absolute left-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchOrAdd}
                  className="w-full rounded-lg border border-paper-border bg-white py-1.5 pl-8 pr-2 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-paper-border/50 py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = selectedId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-amber-50 text-amber-900 font-semibold"
                          : "text-oak-800 hover:bg-oak-100"
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2.5 text-xs text-center text-oak-400">
                  Mos keluvchi topilmadi
                </div>
              )}

              {search.trim() && !isExactMatch && (
                <div
                  onClick={handleAddCustom}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100/80 cursor-pointer border-t border-amber-200 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                  <span className="truncate">
                    {t.addNew}: <strong className="font-bold text-amber-900">&quot;{search.trim()}&quot;</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
