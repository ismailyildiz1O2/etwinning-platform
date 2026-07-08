"use client";

import { cn, getDueDateColor, getPriorityColor, getPriorityLabel, getInitials } from "@/lib/utils";
import { triggerCompletionConfetti } from "@/components/confetti-effect";
import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";
import {
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  MessageSquare,
  Paperclip,
  Bot,
  Calendar,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: string;
  dueDate?: string | null;
  assignee?: { name: string } | null;
  aiGenerated?: boolean;
  _count?: { notes: number; files: number };
}

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    isCompleted: boolean;
    priority: string;
    dueDate?: string | null;
    assignee?: { name: string } | null;
    notes?: { id: string }[];
    files?: { id: string }[];
    tags?: string;
    aiGenerated?: boolean;
    subTasks?: SubTask[];
    _count?: { notes: number; files: number; subTasks?: number };
  };
  onToggle?: (id: string, completed: boolean) => void;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isSubTask?: boolean;
  isStudent?: boolean;
}

export function TaskItem({ task, onToggle, onClick, onDelete, onEdit, isSubTask = false, isStudent = false }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    setIsAnimating(true);

    if (newCompleted) {
      triggerCompletionConfetti();
      toast.success("Görev tamamlandı! 🎉");
    }

    setTimeout(() => setIsAnimating(false), 500);

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: newCompleted }),
      });
      if (!res.ok) throw new Error();
      onToggle?.(task.id, newCompleted);
    } catch {
      setIsCompleted(!newCompleted);
      toast.error("Görev durumu güncellenemedi");
    }
  };

  const noteCount = task.notes?.length || task._count?.notes || 0;
  const fileCount = task.files?.length || task._count?.files || 0;
  const subTaskCount = task.subTasks?.length || task._count?.subTasks || 0;

  const dueDateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      })
    : null;

  let parsedTags: string[] = [];
  try {
    parsedTags = task.tags ? JSON.parse(task.tags) : [];
  } catch {
    parsedTags = [];
  }

  return (
    <div>
      {/* Main task row */}
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
          isSubTask && "ml-8 border-dashed",
          isCompleted
            ? "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/30"
            : isSubTask
              ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700/50"
              : "bg-white dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-md hover:shadow-blue-500/5",
          isAnimating && "scale-[0.98]"
        )}
      >
        {/* SubTask indicator */}
        {isSubTask && (
          <CornerDownRight className="w-3.5 h-3.5 text-blue-400/60 dark:text-blue-500/40 shrink-0" />
        )}

        {/* Subtask expand toggle */}
        {!isSubTask && subTaskCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSubTasksOpen(!isSubTasksOpen);
            }}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            {isSubTasksOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-300",
            isSubTask ? "w-4 h-4" : "w-5 h-5",
            isCompleted
              ? "bg-gradient-to-br from-green-400 to-green-500 border-green-500 shadow-sm shadow-green-500/25"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          )}
        >
          {isCompleted && (
            <Check className={cn("text-white animate-in zoom-in-50 duration-200", isSubTask ? "w-2.5 h-2.5" : "w-3 h-3")} />
          )}
        </button>

        {/* Task content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onClick?.(task.id)}
        >
          <span
            className={cn(
              "font-medium transition-all duration-300",
              isSubTask ? "text-xs" : "text-sm",
              isCompleted
                ? "text-gray-400 dark:text-gray-500 line-through"
                : "text-gray-800 dark:text-gray-200"
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {parsedTags.length > 0 && (
            <div className="flex items-center -space-x-1 mr-1">
              {parsedTags.map((tagId) => {
                const criteria = QUALITY_LABEL_CRITERIA.find(c => c.id === tagId);
                if (!criteria) return null;
                return (
                  <div
                    key={tagId}
                    title={criteria.label}
                    className={cn("w-3 h-3 rounded-full border border-white dark:border-gray-900", criteria.color.split(" ")[1])} // using the bg-color part
                  />
                );
              })}
            </div>
          )}

          {task.aiGenerated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs">
              <Bot className="w-3 h-3" />
            </span>
          )}

          {/* Subtask count badge */}
          {!isSubTask && subTaskCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-blue-500 dark:text-blue-400 font-medium">
              <CornerDownRight className="w-3 h-3" />
              {subTaskCount}
            </span>
          )}

          {noteCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {noteCount}
            </span>
          )}

          {fileCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
              <Paperclip className="w-3 h-3" />
              {fileCount}
            </span>
          )}

          {/* Priority */}
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
              getPriorityColor(task.priority)
            )}
          >
            {getPriorityLabel(task.priority)}
          </span>

          {/* Due date */}
          {dueDateLabel && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                getDueDateColor(task.dueDate || null)
              )}
            >
              <Calendar className="w-3 h-3" />
              {dueDateLabel}
            </span>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div
              className={cn(
                "rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0",
                isSubTask ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[10px]"
              )}
              title={task.assignee.name}
            >
              {getInitials(task.assignee.name)}
            </div>
          )}

          {/* Three dot menu */}
          {!isStudent && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Düzenle
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    const cycle: Record<string, string> = { low: "medium", medium: "high", high: "low" };
                    const newPriority = cycle[task.priority] || "medium";
                    try {
                      const res = await fetch(`/api/tasks/${task.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ priority: newPriority }),
                      });
                      if (!res.ok) throw new Error();
                      toast.success(`Öncelik "${getPriorityLabel(newPriority)}" olarak değiştirildi`);
                      onToggle?.(task.id, task.isCompleted);
                    } catch {
                      toast.error("Öncelik değiştirilemedi");
                    }
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Öncelik Değiştir
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(task.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sil
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* SubTasks */}
      {!isSubTask && subTaskCount > 0 && isSubTasksOpen && task.subTasks && (
        <div className="space-y-1.5 mt-1.5 animate-in slide-in-from-top-2 duration-200">
          {task.subTasks.map((subTask) => (
            <TaskItem
              key={subTask.id}
              task={subTask}
              onToggle={onToggle}
              onClick={onClick}
              onDelete={onDelete}
              onEdit={onEdit}
              isSubTask
              isStudent={isStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
