"use client";

import { cn } from "@/lib/utils";
import { FolderOpen, ListTodo, CheckCircle2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardsProps {
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    const startValue = 0;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Toplam Proje",
      value: stats.totalProjects,
      icon: FolderOpen,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Toplam Görev",
      value: stats.totalTasks,
      icon: ListTodo,
      gradient: "from-amber-500 to-amber-600",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Tamamlanan",
      value: stats.completedTasks,
      icon: CheckCircle2,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Tamamlanma Oranı",
      value: stats.completionRate,
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative group rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 p-5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          {/* Gradient decoration */}
          <div
            className={cn(
              "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 dark:opacity-10 rounded-bl-[100px] transition-opacity group-hover:opacity-10 dark:group-hover:opacity-20",
              card.gradient
            )}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  card.iconBg
                )}
              >
                <card.icon className={cn("w-5 h-5", card.iconColor)} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              <AnimatedNumber value={card.value} />
              {card.suffix && (
                <span className="text-xl ml-0.5">{card.suffix}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
