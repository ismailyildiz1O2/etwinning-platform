"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn, getPriorityColor } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: string;
  dueDate: string | null;
  assignee?: { id: string; name: string } | null;
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {format(currentDate, dateFormat, { locale: tr })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            Bugün
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] bg-gray-200/50 dark:bg-gray-800/50 gap-[1px]">
        {daysInMonth.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          // Get tasks for this day
          const dayTasks = tasks.filter((task) =>
            task.dueDate ? isSameDay(new Date(task.dueDate), day) : false
          );

          return (
            <div
              key={i}
              className={cn(
                "bg-white dark:bg-gray-950 p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/80",
                !isCurrentMonth && "text-gray-400 bg-gray-50/50 dark:bg-gray-950/50 dark:text-gray-600"
              )}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "flex items-center justify-center w-7 h-7 text-sm rounded-full",
                      isTodayDate
                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25"
                        : "text-gray-700 dark:text-gray-300 font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                      {dayTasks.length} görev
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-xs font-medium truncate transition-all",
                        getPriorityColor(task.priority),
                        task.isCompleted && "opacity-60 grayscale"
                      )}
                      title={task.title}
                    >
                      <div className="flex items-center gap-1.5">
                        {task.isCompleted ? (
                          <Check className="w-3 h-3 shrink-0" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-70" />
                        )}
                        <span className={cn("truncate", task.isCompleted && "line-through")}>
                          {task.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
