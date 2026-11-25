"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  BookmarkPlus,
  ShieldCheck,
  LogOut,
  Library,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navigation = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.newBooking, href: "/borrowings/new", icon: BookmarkPlus },
    { name: t.activeBorrowings, href: "/borrowings", icon: BookOpen },
    { name: t.booksInventory, href: "/books", icon: Library },
    { name: t.students, href: "/students", icon: GraduationCap },
    { name: t.staff, href: "/staff", icon: Users },
    { name: t.adminManagement, href: "/admins", icon: ShieldCheck, adminOnly: true },
  ];

  return (
    <aside
      className={`relative flex-shrink-0 bg-oak-900 border-r border-oak-800 flex flex-col min-h-screen text-oak-300 transition-all duration-300 ease-in-out z-20 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-oak-800/80">
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? "justify-center w-full" : ""}`}>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Library className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="text-sm font-semibold tracking-wide text-white truncate">{t.appName}</h1>
              <p className="text-[10px] text-oak-500 font-medium truncate uppercase tracking-wider">
                {t.internalPortal}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-oak-800 text-oak-300 hover:text-white hover:bg-oak-700 border border-oak-700 shadow-md transition-colors"
        title={collapsed ? t.expand : t.collapse}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-lg text-xs font-semibold transition-all group ${
                collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-amber-500 text-oak-950 shadow-sm font-bold"
                  : "text-oak-300 hover:text-white hover:bg-oak-800/80"
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive ? "text-oak-950" : "text-oak-400 group-hover:text-amber-400"
                }`}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-oak-800/80 bg-oak-950/40 space-y-3">
        <LanguageSwitcher compact={collapsed} />

        <div className={`flex items-center rounded-lg bg-oak-850/60 p-2 border border-oak-800 ${
          collapsed ? "justify-center" : "justify-between"
        }`}>
          {!collapsed && (
            <div className="truncate pr-1">
              <p className="text-xs font-semibold text-white truncate">{user?.username || "Librarian"}</p>
              <span className="inline-block text-[9px] uppercase tracking-wider font-bold text-amber-400">
                {user?.role || "staff"}
              </span>
            </div>
          )}
          <button
            onClick={logout}
            title={t.logout}
            className="p-1.5 rounded-md text-oak-400 hover:text-red-400 hover:bg-oak-800 transition-colors flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
