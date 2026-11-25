"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BookOpen, Lock, User as UserIcon, AlertCircle } from "lucide-react";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push(redirectPath);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(t.invalidCredentials);
      } else {
        setError(err.response?.data?.detail || "Server connection error.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-7 rounded-2xl border border-paper-border bg-paper-card p-8 shadow-card">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shadow-sm">
          <BookOpen className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-oak-900">
          {t.loginTitle}
        </h2>
        <p className="mt-1 text-xs text-oak-500">
          {t.loginSubtitle}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-oak-700 uppercase tracking-wider mb-1.5">
            {t.usernameLabel}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-oak-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-lg border border-paper-border bg-paper-bg py-2.5 pl-9 pr-3 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder={t.usernamePlaceholder}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-oak-700 uppercase tracking-wider mb-1.5">
            {t.passwordLabel}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-oak-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-paper-border bg-paper-bg py-2.5 pl-9 pr-3 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder={t.passwordPlaceholder}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-oak-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? t.authenticating : t.loginButton}
          </button>
        </div>
      </form>

      <div className="text-center pt-2 border-t border-paper-border">
        <p className="text-[11px] text-oak-500">
          {t.loginProtectedNote}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper-bg px-4 sm:px-6">
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher className="shadow-sm" />
      </div>

      <Suspense fallback={<div className="text-xs text-oak-400">Yuklanmoqda...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
