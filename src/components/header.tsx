"use client";

import { cn, getInitials } from "@/lib/utils";
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  Settings,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { NotificationsDropdown } from "./notifications-dropdown";
import { GlobalSettingsModal } from "./global-settings-modal";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "appearance">("profile");
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = session?.user?.name || "Kullanıcı";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/80 dark:bg-[#121824]/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            eTwin Asistan
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
            aria-label="Tema değiştir"
          >
            <div className="relative w-5 h-5">
              <Sun
                className={cn(
                  "w-5 h-5 absolute inset-0 text-amber-500 transition-all duration-500",
                  theme === "dark"
                    ? "rotate-0 scale-100 opacity-100"
                    : "-rotate-90 scale-0 opacity-0"
                )}
              />
              <Moon
                className={cn(
                  "w-5 h-5 absolute inset-0 text-blue-500 transition-all duration-500",
                  theme === "dark"
                    ? "rotate-90 scale-0 opacity-0"
                    : "rotate-0 scale-100 opacity-100"
                )}
              />
            </div>
          </button>
        )}

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
              {getInitials(userName)}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown
              className={cn(
                "hidden sm:block w-4 h-4 text-gray-400 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email || ""}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSettingsTab("profile");
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profil
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSettingsTab("appearance");
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Ayarlar
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {mounted && typeof document !== "undefined" && createPortal(
        <GlobalSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          defaultTab={settingsTab} 
        />,
        document.body
      )}
    </header>
  );
}
