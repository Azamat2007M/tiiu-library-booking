"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, Dictionary, dictionaries } from "@/locales/dictionaries";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("library_lang") as Language;
    if (saved && (saved === "uz" || saved === "ru" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("library_lang", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: dictionaries[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
