"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PhaseCard } from "@/components/phase-card";
import { TaskDrawer } from "@/components/task-drawer";
import { NotesDrawer } from "@/components/notes-drawer";
import { QualityLabelPanel } from "@/components/quality-label-panel";
import { EvidencePanel } from "@/components/evidence-panel";
import { CalendarView } from "@/components/calendar-view";
import {
  cn,
  getStatusColor,
  getStatusLabel,
  formatDate,
  phaseDotColors,
} from "@/lib/utils";
import {
  FileDown,
  Printer,
  Share2,
  Calendar,
  CheckCircle2,
  Loader2,
  Wrench,
  NotebookText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Phase {
  id: string;
  title: string;
  description: string | null;
  order: number;
  startDate: string | null;
  endDate: string | null;
  tasks: {
    id: string;
    title: string;
    isCompleted: boolean;
    priority: string;
    dueDate: string | null;
    assignee: { id: string; name: string } | null;
    notes: { id: string }[];
    files: { id: string }[];
    aiGenerated: boolean;
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
    _count?: { notes: number; files: number; subTasks: number };
  }[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  phases: Phase[];
  members: { user: { id: string; name: string; email: string } }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "calendar" | "quality-label" | "evidence">("tasks");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProject(data);
    } catch {
      toast.error("Proje yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleTaskToggle = () => {
    fetchProject();
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Görev silindi");
      fetchProject();
    } catch {
      toast.error("Görev silinemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Proje bulunamadı</p>
      </div>
    );
  }

  const totalTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0
  );
  const completedTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.filter((t) => t.isCompleted).length,
    0
  );
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectMembers = project.members.map((m) => m.user);
  const isStudent = session?.user?.role === "student";

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Phase navigation sidebar */}
      <div className="hidden xl:flex flex-col w-56 border-r border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shrink-0">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">
          Aşamalar
        </p>
        {project.phases
          .sort((a, b) => a.order - b.order)
          .map((phase) => {
            const phaseCompleted =
              phase.tasks.length > 0 &&
              phase.tasks.every((t) => t.isCompleted);
            return (
              <button
                key={phase.id}
                onClick={() => {
                  document
                    .getElementById(`phase-${phase.id}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full shrink-0",
                    phaseDotColors[phase.order] || "bg-gray-400",
                    !phaseCompleted && "opacity-50"
                  )}
                />
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {phase.title}
                </span>
              </button>
            );
          })}
          
        <div className="mt-6 mb-2 px-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            ARAÇLAR
          </p>
        </div>
        
        <Link
          href="/dashboard/tools"
          className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl text-sm text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
            <Wrench className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
            Araç Kütüphanesi
          </span>
        </Link>
        
        <a
          href="https://www.canva.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-[10px]">
              C
            </div>
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 truncate transition-colors">
              Canva
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        <a
          href="https://padlet.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-[10px]">
              P
            </div>
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 truncate transition-colors">
              Padlet
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        <div className="mt-4 mb-2 px-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            NOTLAR
          </p>
        </div>
        <button
          onClick={() => setIsNotesDrawerOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <NotebookText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 truncate">
            Proje Notları
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          {/* Project header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getStatusColor(project.status)
                    )}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(project.startDate)} — {formatDate(project.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {completedTasks}/{totalTasks} görev tamamlandı
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    PDF · Yakında
                  </div>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Yazdır · Yakında
                  </div>
                </div>
                <div className="relative group">
                  <button
                    disabled
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:cursor-not-allowed"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Paylaş · Yakında
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "tasks" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                Görevler
                {activeTab === "tasks" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "calendar" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                Takvim
                {activeTab === "calendar" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("quality-label")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "quality-label" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                Kalite Etiketi
                {activeTab === "quality-label" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("evidence")}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative",
                  activeTab === "evidence" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                Kanıtlar
                {activeTab === "evidence" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Main Content Areas */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {project.phases
                .sort((a, b) => a.order - b.order)
                .map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    isStudent={isStudent}
                    onTaskToggle={handleTaskToggle}
                    onTaskClick={handleTaskClick}
                    onTaskEdit={handleTaskClick}
                    onTaskDelete={handleTaskDelete}
                    onAddTask={() => toast.info("Görev ekleme özelliği yakında eklenecek")}
                    onAISuggest={() => toast.info("AI öneri özelliği yakında eklenecek")}
                  />
                ))}
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="space-y-4">
              <CalendarView
                tasks={project.phases.flatMap(p => p.tasks)}
                onTaskClick={handleTaskClick}
              />
            </div>
          )}

          {activeTab === "quality-label" && (
            <QualityLabelPanel projectId={projectId} project={project} />
          )}

          {activeTab === "evidence" && (
            <EvidencePanel projectId={projectId} project={project} onUpdate={fetchProject} />
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
          fetchProject();
        }}
        projectMembers={projectMembers}
      />

      <NotesDrawer
        projectId={projectId}
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
      />
    </div>
  );
}
