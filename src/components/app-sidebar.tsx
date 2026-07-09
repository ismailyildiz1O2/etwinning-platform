"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Archive,
  Wrench,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AppSidebarProps {
  projects?: { id: string; name: string; status: string }[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ projects = [], isOpen = true, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(!isOpen);
  const isStudent = session?.user?.role === "student";
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    setCollapsed(!isOpen);
  }, [isOpen]);

  const navItems = [
    { href: "/dashboard", label: "Ana Sayfa", icon: Home },
    { href: "/dashboard/my-tasks", label: "Görevlerim", icon: CheckSquare },
    { href: "/dashboard", label: "Ayarlar", icon: Settings, isSetting: true },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200/80 dark:border-gray-800/80 transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              eTwin
            </span>
          )}
        </Link>
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            onToggle?.();
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Home */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            isActive("/dashboard")
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Home className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Ana Sayfa</span>}
        </Link>

        {/* My Tasks */}
        <Link
          href="/dashboard/my-tasks"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium transition-all duration-200",
            isActive("/dashboard/my-tasks")
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <CheckSquare className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Görevlerim</span>}
        </Link>

        {/* Tools */}
        <Link
          href="/dashboard/tools"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium transition-all duration-200",
            isActive("/dashboard/tools")
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Wrench className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Araçlar</span>}
        </Link>

        {/* Admin Panel */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Admin Paneli</span>}
          </Link>
        )}

        {/* Projects */}
        {!collapsed && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Projeler
            </p>
          </div>
        )}

        {collapsed && (
          <div className="pt-3 pb-1 flex justify-center">
            <FolderOpen className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {projects.filter(p => p.status !== "archived").map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              pathname.startsWith(`/projects/${project.id}`)
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                project.status === "active"
                  ? "bg-green-500"
                  : project.status === "completed"
                    ? "bg-blue-500"
                    : "bg-gray-400"
              )}
            />
            {!collapsed && (
              <span className="truncate">{project.name}</span>
            )}
          </Link>
        ))}

        {/* Archive Link */}
        <Link
          href="/dashboard/archive"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium transition-all duration-200",
            isActive("/dashboard/archive")
              ? "bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-200 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Archive className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Arşiv</span>}
        </Link>

        {!collapsed && projects.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
            Henüz proje yok
          </p>
        )}
      </nav>

      {/* Bottom: Settings */}
      {!isStudent && (
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800/80">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Ayarlar</span>}
        </Link>
      </div>
      )}
    </aside>
  );
}
