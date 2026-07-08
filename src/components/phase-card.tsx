"use client";

import { cn, phaseColors } from "@/lib/utils";
import { TaskItem } from "@/components/task-item";
import { ChevronDown, ChevronUp, Plus, Bot, Calendar } from "lucide-react";
import { useState } from "react";

interface PhaseCardProps {
  phase: {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    startDate?: string | null;
    endDate?: string | null;
    tasks: {
      id: string;
      title: string;
      isCompleted: boolean;
      priority: string;
      dueDate?: string | null;
      assignee?: { name: string } | null;
      notes?: { id: string }[];
      files?: { id: string }[];
      aiGenerated?: boolean;
      subTasks?: {
        id: string;
        title: string;
        isCompleted: boolean;
        priority: string;
        dueDate?: string | null;
        assignee?: { name: string } | null;
        aiGenerated?: boolean;
        _count?: { notes: number; files: number };
      }[];
      _count?: { notes: number; files: number; subTasks?: number };
    }[];
  };
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onTaskClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onAddTask?: (phaseId: string) => void;
  onAISuggest?: (phaseId: string) => void;
  isStudent?: boolean;
}

export function PhaseCard({
  phase,
  onTaskToggle,
  onTaskClick,
  onTaskDelete,
  onTaskEdit,
  onAddTask,
  onAISuggest,
  isStudent,
}: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedTasks = (phase.tasks || []).filter((t) => t.isCompleted).length;
  const totalTasks = (phase.tasks || []).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const phaseColor = phaseColors[phase.order] || phaseColors[1];

  const startDate = phase.startDate
    ? new Date(phase.startDate).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      })
    : null;
  const endDate = phase.endDate
    ? new Date(phase.endDate).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div
      id={`phase-${phase.id}`}
      className={cn(
        "rounded-2xl border-l-4 border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-all duration-300",
        phaseColor
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Aşama {phase.order}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {phase.title}
            </h3>
          </div>

          {phase.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {phase.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            {startDate && endDate && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {startDate} — {endDate}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedTasks}/{totalTasks} görev tamamlandı
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden max-w-xs">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                phase.order === 1 && "bg-blue-500",
                phase.order === 2 && "bg-green-500",
                phase.order === 3 && "bg-orange-500",
                phase.order === 4 && "bg-purple-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Tasks */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-4 space-y-2">
          {(phase.tasks || []).length > 0 ? (
            (phase.tasks || []).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isStudent={isStudent}
                onToggle={onTaskToggle}
                onClick={onTaskClick}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit}
              />
            ))
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Bu aşamada henüz görev yok
            </p>
          )}

          {/* Action buttons */}
          {!isStudent && (
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onAddTask?.(phase.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              Görev Ekle
            </button>
            <button
              onClick={() => onAISuggest?.(phase.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 text-sm text-purple-500 dark:text-purple-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              <Bot className="w-4 h-4" />
              AI Öner
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
