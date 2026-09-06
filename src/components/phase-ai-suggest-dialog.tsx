"use client";

import { useEffect, useState } from "react";
import { X, Bot, Loader2, Sparkles, RefreshCw, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn, getPriorityColor, getPriorityLabel } from "@/lib/utils";
import { useI18n } from "./i18n-provider";

interface Suggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface PhaseAISuggestDialogProps {
  phaseId: string | null;
  phaseTitle?: string;
  onClose: () => void;
  onTasksAdded: () => void;
}

export function PhaseAISuggestDialog({ phaseId, phaseTitle, onClose, onTasksAdded }: PhaseAISuggestDialogProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);

  const isOpen = Boolean(phaseId);

  const fetchSuggestions = async (id: string, isCancelled: () => boolean = () => false) => {
    try {
      const res = await fetch("/api/ai/phase-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: id, locale }),
      });
      if (isCancelled()) return;
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isCancelled()) return;
      const list: Suggestion[] = data.suggestions || [];
      setSuggestions(list);
      setSelected(new Set(list.map((_, i) => i)));
      setSource(data.source === "ai" ? "ai" : "fallback");
    } catch {
      if (!isCancelled()) toast.error(t.aiSuggest.fetchError);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const regenerate = () => {
    if (!phaseId) return;
    setLoading(true);
    setSuggestions([]);
    setSelected(new Set());
    setSource(null);
    fetchSuggestions(phaseId);
  };

  // The parent remounts this dialog (via `key`) whenever a new phase is chosen,
  // so a single fetch on mount is enough.
  useEffect(() => {
    if (!phaseId) return;
    let cancelled = false;
    (async () => {
      await fetchSuggestions(phaseId, () => cancelled);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!phaseId || selected.size === 0) return;
    setAdding(true);
    let added = 0;
    try {
      for (const index of Array.from(selected).sort((a, b) => a - b)) {
        const s = suggestions[index];
        if (!s) continue;
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseId,
            title: s.title,
            description: s.description || undefined,
            priority: s.priority,
            aiGenerated: true,
          }),
        });
        if (res.ok) added += 1;
      }
      if (added > 0) {
        toast.success(t.aiSuggest.added.replace("{count}", String(added)));
        onTasksAdded();
        onClose();
      } else {
        toast.error(t.aiSuggest.addError);
      }
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.aiSuggest.title}</h2>
              {phaseTitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{phaseTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm">{t.aiSuggest.loading}</p>
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              {t.aiSuggest.empty}
            </div>
          )}

          {!loading && source === "fallback" && suggestions.length > 0 && (
            <div className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
              {t.aiSuggest.fallbackNotice}
            </div>
          )}

          {!loading &&
            suggestions.map((s, index) => {
              const checked = selected.has(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggle(index)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all",
                    checked
                      ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                      checked
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                      <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded", getPriorityColor(s.priority))}>
                        {getPriorityLabel(s.priority, locale)}
                      </span>
                    </span>
                    {s.description && (
                      <span className="block mt-1 text-sm text-gray-500 dark:text-gray-400">{s.description}</span>
                    )}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
          <button
            type="button"
            onClick={regenerate}
            disabled={loading || adding}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {t.aiSuggest.regenerate}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading || adding || selected.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t.aiSuggest.addSelected.replace("{count}", String(selected.size))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddTaskDialogProps {
  phaseId: string | null;
  phaseTitle?: string;
  onClose: () => void;
  onTaskAdded: () => void;
}

export function AddTaskDialog({ phaseId, phaseTitle, onClose, onTaskAdded }: AddTaskDialogProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  if (!phaseId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.addTaskDialog.success);
      onTaskAdded();
      onClose();
    } catch {
      toast.error(t.addTaskDialog.error);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.task.addTask}</h2>
              {phaseTitle && <p className="text-sm text-gray-500 dark:text-gray-400">{phaseTitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.addTaskDialog.titleLabel}
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.addTaskDialog.titlePlaceholder}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.addTaskDialog.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.task.priority}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
                className={inputClass}
              >
                <option value="high">{t.addTaskDialog.priorityHigh}</option>
                <option value="medium">{t.addTaskDialog.priorityMedium}</option>
                <option value="low">{t.addTaskDialog.priorityLow}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.task.dueDate}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t.task.addTask}
          </button>
        </div>
      </form>
    </div>
  );
}
