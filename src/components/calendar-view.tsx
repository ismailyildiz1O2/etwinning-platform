"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
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
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, CalendarDays, CalendarRange, LayoutList } from "lucide-react";
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

type ViewMode = "month" | "2months" | "week" | "day";

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");

  const handleNext = () => {
    if (view === "month" || view === "2months") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const handlePrev = () => {
    if (view === "month" || view === "2months") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const renderTask = (task: Task) => (
    <button
      key={task.id}
      onClick={() => onTaskClick(task.id)}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-md text-xs font-medium truncate transition-all mb-1",
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
  );

  const renderDayCell = (day: Date, isCurrentMonth: boolean, heightClass: string) => {
    const isTodayDate = isToday(day);
    const dayTasks = tasks.filter((task) =>
      task.dueDate ? isSameDay(new Date(task.dueDate), day) : false
    );

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "bg-white dark:bg-gray-950 p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/80 overflow-hidden",
          heightClass,
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
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {dayTasks.map(renderTask)}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthGrid = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 flex flex-col">
        {view === "2months" && (
          <div className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 capitalize text-center">
            {format(date, "MMMM yyyy", { locale: tr })}
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          {weekDays.map((day, i) => (
            <div key={i} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] bg-gray-200/50 dark:bg-gray-800/50 gap-[1px] flex-1">
          {daysInMonth.map((day) => renderDayCell(day, isSameMonth(day, monthStart), "min-h-[120px]"))}
        </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          {weekDays.map((day, i) => (
            <div key={i} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-gray-200/50 dark:bg-gray-800/50 gap-[1px] flex-1 h-[600px]">
          {daysInWeek.map((day) => renderDayCell(day, true, "h-full"))}
        </div>
      </div>
    );
  };

  const renderDayGrid = () => {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {format(currentDate, "EEEE", { locale: tr })}
          </div>
        </div>
        <div className="bg-gray-200/50 dark:bg-gray-800/50 gap-[1px] flex-1 min-h-[600px] flex">
          <div className="flex-1">
            {renderDayCell(currentDate, true, "h-full")}
          </div>
        </div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (view === "month" || view === "2months") return format(currentDate, "MMMM yyyy", { locale: tr });
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) return `${format(start, "d")} - ${format(end, "d MMMM yyyy", { locale: tr })}`;
      return `${format(start, "d MMMM", { locale: tr })} - ${format(end, "d MMMM yyyy", { locale: tr })}`;
    }
    if (view === "day") return format(currentDate, "d MMMM yyyy, EEEE", { locale: tr });
    return "";
  };

  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {getHeaderTitle()}
          </h2>
          <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all text-gray-600 dark:text-gray-400"
            >
              Bugün
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all text-gray-600 dark:text-gray-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: "day", label: "Gün", icon: LayoutList },
            { id: "week", label: "Hafta", icon: CalendarDays },
            { id: "month", label: "Ay", icon: CalendarIcon },
            { id: "2months", label: "2 Ay", icon: CalendarRange },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id as ViewMode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                  view === v.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex flex-col sm:flex-row flex-1 min-h-0 bg-gray-200/50 dark:bg-gray-800/50 gap-[1px]">
        {view === "month" && renderMonthGrid(currentDate)}
        {view === "2months" && (
          <>
            {renderMonthGrid(currentDate)}
            {renderMonthGrid(addMonths(currentDate, 1))}
          </>
        )}
        {view === "week" && renderWeekGrid()}
        {view === "day" && renderDayGrid()}
      </div>
    </div>
  );
}
