"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { TaskDrawer } from "@/components/task-drawer";
import {
  cn,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getDueDateColor,
  getInitials,
  formatDate,
} from "@/lib/utils";
import {
  Filter,
  ArrowUpDown,
  Check,
  Bot,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { triggerCompletionConfetti } from "@/components/confetti-effect";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: string;
  dueDate: string | null;
  aiGenerated: boolean;
  phase: {
    id: string;
    title: string;
    order: number;
  };
  assignee: { id: string; name: string } | null;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("Görevler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.isCompleted;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: newCompleted } : t
      )
    );

    if (newCompleted) {
      triggerCompletionConfetti();
      toast.success("Görev tamamlandı! 🎉");
    }

    try {
      await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: newCompleted }),
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !newCompleted } : t
        )
      );
    }
  };

  // Filter & sort
  const filteredTasks = tasks
    .filter((t) => {
      if (statusFilter === "completed" && !t.isCompleted) return false;
      if (statusFilter === "pending" && t.isCompleted) return false;
      if (sourceFilter === "ai" && !t.aiGenerated) return false;
      if (sourceFilter === "manual" && t.aiGenerated) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (phaseFilter !== "all" && t.phase.id !== phaseFilter) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  const uniquePhases = Array.from(
    new Map(tasks.map((t) => [t.phase.id, t.phase])).values()
  ).sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tüm Görevler
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {tasks.length} görev · {tasks.filter((t) => t.isCompleted).length}{" "}
          tamamlandı
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/50">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Görev ara..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Bekleyen</option>
          <option value="completed">Tamamlanan</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tüm Kaynaklar</option>
          <option value="ai">AI Oluşturma</option>
          <option value="manual">Manuel</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tüm Öncelikler</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>

        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tüm Aşamalar</option>
          {uniquePhases.map((p) => (
            <option key={p.id} value={p.id}>
              Aşama {p.order}: {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-700/50">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Görev
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aşama
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Öncelik
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Atanan
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Son Tarih
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setIsDrawerOpen(true);
                  }}
                  className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(task.id);
                      }}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        task.isCompleted
                          ? "bg-gradient-to-br from-green-400 to-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      )}
                    >
                      {task.isCompleted && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          task.isCompleted
                            ? "text-gray-400 line-through"
                            : "text-gray-900 dark:text-white"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.aiGenerated && (
                        <Bot className="w-3.5 h-3.5 text-purple-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Aşama {task.phase.order}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                        getPriorityColor(task.priority)
                      )}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {getInitials(task.assignee.name)}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          getDueDateColor(task.dueDate)
                        )}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        task.isCompleted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}
                    >
                      {task.isCompleted ? "Tamamlandı" : "Bekliyor"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTasks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Filtrelere uygun görev bulunamadı
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTaskId(null);
          fetchTasks();
        }}
      />
    </div>
  );
}
