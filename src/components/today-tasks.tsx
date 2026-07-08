"use client";

import { cn } from "@/lib/utils";
import { triggerCompletionConfetti } from "@/components/confetti-effect";
import { Check, Calendar, PartyPopper } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface TodayTask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string;
  phase: {
    project: {
      id: string;
      name: string;
    };
  };
}

export function TodayTasks() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/today");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

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

  const todayCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Bugünün Görevleri
          </h3>
        </div>
        {todayCount > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
            {todayCount}
          </span>
        )}
      </div>

      {/* Tasks */}
      <div className="px-5 py-3">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <PartyPopper className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Bugün göreviniz yok! 🎉
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Harika iş çıkardınız
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  task.isCompleted
                    ? "opacity-50"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <button
                  onClick={() => handleToggle(task.id)}
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300",
                    task.isCompleted
                      ? "bg-gradient-to-br from-green-400 to-green-500 border-green-500"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                  )}
                >
                  {task.isCompleted && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium block",
                      task.isCompleted
                        ? "text-gray-400 line-through"
                        : "text-gray-800 dark:text-gray-200"
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {task.phase.project.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
