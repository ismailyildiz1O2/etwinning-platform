"use client";

import { useState, useRef, useEffect } from "react";
import { cn, getInitials, getStatusColor, getStatusLabel, phaseDotColors } from "@/lib/utils";
import { Calendar, CheckCircle2, ListTodo, MoreVertical, Trash2, Archive, PauseCircle, PlayCircle, Edit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useSession } from "next-auth/react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    startDate: string;
    endDate: string;
    phases: {
      order: number;
      tasks: { isCompleted: boolean }[];
    }[];
  };
  onUpdate?: () => void;
  index?: number;
}

export function ProjectCard({ project, onUpdate, index = 0 }: ProjectCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isStudent = session?.user?.role === "student";

  const totalTasks = project.phases.reduce(
    (sum, phase) => sum + (phase.tasks?.length ?? 0),
    0
  );
  const completedTasks = project.phases.reduce(
    (sum, phase) => sum + (phase.tasks?.filter((t) => t.isCompleted).length ?? 0),
    0
  );
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const startDate = new Date(project.startDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  const endDate = new Date(project.endDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Durum güncellenemedi");
      
      toast.success("Proje durumu güncellendi");
      if (onUpdate) onUpdate();
      else router.refresh();
    } catch (error) {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (!window.confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Proje silinemedi");
      
      toast.success("Proje başarıyla silindi");
      if (onUpdate) onUpdate();
      else router.refresh();
    } catch (error) {
      toast.error("İşlem sırasında bir hata oluştu");
      setIsUpdating(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    router.push(`/projects/${project.id}/settings`);
  };

  const bgColors = [
    "bg-[var(--color-card-green)] dark:bg-gray-900",
    "bg-[var(--color-card-salmon)] dark:bg-gray-900",
    "bg-[var(--color-card-lilac)] dark:bg-gray-900"
  ];
  const cardBgClass = bgColors[index % bgColors.length];

  return (
    <div
      onClick={() => !isUpdating && router.push(`/projects/${project.id}`)}
      className={cn(
        "group relative cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-800/50",
        cardBgClass,
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight transition-colors pr-2">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                getStatusColor(project.status)
              )}
            >
              {getStatusLabel(project.status)}
            </span>
            
            {/* Dropdown Menu */}
            {!isStudent && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Düzenle
                  </button>
                  
                  {project.status === "paused" ? (
                    <button
                      onClick={(e) => handleStatusChange(e, "active")}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Başlat
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleStatusChange(e, "paused")}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Durdur
                    </button>
                  )}
                  
                  {project.status !== "archived" ? (
                    <button
                      onClick={(e) => handleStatusChange(e, "archived")}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Arşive taşı
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleStatusChange(e, "active")}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Arşivden Çıkar
                    </button>
                  )}

                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
                  
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Projeyi sil
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {startDate} — {endDate}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedTasks}/{totalTasks} görev
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              %{progress}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase dots */}
        <div className="flex items-center gap-2">
          <ListTodo className="w-3.5 h-3.5 text-gray-400" />
          <div className="flex gap-1.5">
            {project.phases
              .sort((a, b) => a.order - b.order)
              .map((phase) => {
                const phaseCompleted =
                  (phase.tasks?.length ?? 0) > 0 &&
                  (phase.tasks?.every((t) => t.isCompleted) ?? false);
                return (
                  <div
                    key={phase.order}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      phaseDotColors[phase.order] || "bg-gray-400",
                      !phaseCompleted && "opacity-40"
                    )}
                    title={`Aşama ${phase.order}`}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
