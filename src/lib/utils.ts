import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or Date object in Turkish locale.
 * Example: "8 Haziran 2026, Pazartesi"
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return d.toLocaleDateString("tr-TR", options ?? defaultOptions);
}

/**
 * Format a date as a short Turkish date string.
 * Example: "08.06.2026"
 */
export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Get a human-readable relative time string in Turkish.
 * Examples: "az önce", "3 dakika önce", "2 saat önce", "dün", "3 gün önce"
 */
export function getRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "az önce";
  if (diffMin < 60) return `${diffMin} dakika önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay === 1) return "dün";
  if (diffDay < 7) return `${diffDay} gün önce`;
  if (diffWeek === 1) return "geçen hafta";
  if (diffWeek < 4) return `${diffWeek} hafta önce`;
  if (diffMonth === 1) return "geçen ay";
  if (diffMonth < 12) return `${diffMonth} ay önce`;

  return formatDate(d, { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Generate a cryptographically random token string for invites, etc.
 * Uses Web Crypto API available in Node.js 18+.
 */
export function generateToken(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Truncate a string to a maximum length, adding ellipsis if needed.
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Slugify a string for URL-safe usage.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculate completion percentage from completed/total counts.
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get initials from a full name (max 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get Tailwind color classes for a priority level.
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "text-red-500 bg-red-50 dark:bg-red-950";
    case "medium":
      return "text-amber-500 bg-amber-50 dark:bg-amber-950";
    case "low":
      return "text-gray-500 bg-gray-50 dark:bg-gray-950";
    default:
      return "text-gray-500 bg-gray-50 dark:bg-gray-950";
  }
}

/**
 * Get Turkish label for a priority level.
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    case "low":
      return "Düşük";
    default:
      return priority;
  }
}

/**
 * Get Tailwind color classes for a project status.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
    case "completed":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
    case "draft":
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
    case "archived":
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
  }
}

/**
 * Get Turkish label for a project status.
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Aktif";
    case "completed":
      return "Tamamlandı";
    case "draft":
      return "Taslak";
    case "archived":
      return "Arşivlendi";
    default:
      return status;
  }
}

/**
 * Get Tailwind color class for due date urgency.
 */
export function getDueDateColor(
  dueDate: string | Date | null | undefined
): string {
  if (!dueDate) return "text-gray-400";
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(d.getTime())) return "text-gray-400";
  const now = new Date();
  const diffDays = Math.ceil(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "text-red-500";
  if (diffDays <= 3) return "text-amber-500";
  return "text-green-500";
}

/**
 * Phase border-left color classes keyed by phase order (1-based).
 */
export const phaseColors: Record<number, string> = {
  1: "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20",
  2: "border-l-green-500 bg-green-50/30 dark:bg-green-950/20",
  3: "border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/20",
  4: "border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/20",
  5: "border-l-pink-500 bg-pink-50/30 dark:bg-pink-950/20",
  6: "border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/20",
};

/**
 * Phase dot background color classes keyed by phase order (1-based).
 */
export const phaseDotColors: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-green-500",
  3: "bg-orange-500",
  4: "bg-purple-500",
  5: "bg-pink-500",
  6: "bg-teal-500",
};
