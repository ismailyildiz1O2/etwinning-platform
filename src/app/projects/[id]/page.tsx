"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PhaseCard } from "@/components/phase-card";
import { TaskDrawer } from "@/components/task-drawer";
import { NotesDrawer } from "@/components/notes-drawer";
import { QualityLabelPanel } from "@/components/quality-label-panel";
import { EvidencePanel } from "@/components/evidence-panel";
import { CalendarView } from "@/components/calendar-view";
import { ChatPanel } from "@/components/chat-panel";
import { MembersPanel } from "@/components/members-panel";
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
  Settings,
  Wrench,
  NotebookText,
  ExternalLink,
  ArrowLeft,
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
  const [activeTab, setActiveTab] = useState<"tasks" | "calendar" | "quality-label" | "evidence" | "chat" | "members" | "my-tasks" | "tools">("tasks");

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

  const isStudent = session?.user?.role === "student";

  useEffect(() => {
    if (isStudent && activeTab === "tasks") {
      setActiveTab("my-tasks");
    }
  }, [isStudent, activeTab]);

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

  const totalTasks = (project.phases || []).reduce(
    (sum, phase) => sum + (phase.tasks || []).length,
    0
  );
  const completedTasks = (project.phases || []).reduce(
    (sum, phase) => sum + (phase.tasks || []).filter((t) => t.isCompleted).length,
    0
  );
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectMembers = (project.members || []).map((m) => m.user);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Phase navigation sidebar */}
      <div className="hidden xl:flex flex-col w-56 border-r border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 mb-6 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-900 flex items-center justify-center shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
            Ana Sayfaya Dön
          </span>
        </Link>

        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">
          Aşamalar
        </p>
        {[...(project?.phases || [])]
          .sort((a, b) => a.order - b.order)
          .map((phase) => {
            const phaseCompleted =
              (phase.tasks || []).length > 0 &&
              (phase.tasks || []).every((t: any) => t.isCompleted);
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
            <NotebookText className="w-3.5 h-3.5 text-blue-600 dark:bg-blue-400" />
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
                {!isStudent && (
                  <Link
                    href={`/projects/${project.id}/settings`}
                    className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="Proje Ayarları"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
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
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1 scrollbar-hide whitespace-nowrap">
              {isStudent ? (
                <>
                  <button
                    onClick={() => setActiveTab("my-tasks")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "my-tasks" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Görevlerim
                    {activeTab === "my-tasks" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("evidence")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "evidence" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Kanıt Yükle
                    {activeTab === "evidence" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "chat" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Mesajlar
                    {activeTab === "chat" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("tools")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "tools" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Araçlar
                    {activeTab === "tools" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "tasks" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Görevler
                    {activeTab === "tasks" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "calendar" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Takvim
                    {activeTab === "calendar" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("quality-label")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "quality-label" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Kalite Etiketi
                    {activeTab === "quality-label" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("evidence")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "evidence" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Kanıtlar
                    {activeTab === "evidence" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "chat" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Mesajlar
                    {activeTab === "chat" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === "members" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    Kişiler
                    {activeTab === "members" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                </>
              )}
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
          {!isStudent && activeTab === "tasks" && (
            <div className="space-y-4">
              {[...(project?.phases || [])]
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

          {isStudent && activeTab === "my-tasks" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bana Atanan Görevler</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bu projede yapmanız gereken görevler aşağıda listelenmiştir. Görevlere tıklayarak detaylarını görebilir ve kanıt yükleyebilirsiniz.</p>
              </div>
              
              {(() => {
                const myAssignedPhases = project?.phases?.map(phase => {
                  const myTasks = phase.tasks?.filter(t => t.assignee?.id === session?.user?.id) || [];
                  return { ...phase, myTasks };
                }).filter(phase => phase.myTasks.length > 0) || [];

                if (myAssignedPhases.length === 0) {
                  return (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Harika! Şu anlık göreviniz yok</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Öğretmenleriniz size görev atadığında burada görünecektir.</p>
                    </div>
                  );
                }

                return myAssignedPhases.map((phase) => (
                  <div key={phase.id} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{phase.title}</h3>
                    </div>
                    <div className="space-y-2 pl-5">
                      {phase.myTasks.map(task => {
                        return (
                          <div 
                            key={task.id} 
                            onClick={() => handleTaskClick(task.id)}
                            className={cn(
                              "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                              task.isCompleted
                                ? "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskToggle();
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                  task.isCompleted
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500 hover:text-green-500/50"
                                )}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <div>
                                <h4 className={cn(
                                  "font-medium text-sm transition-colors",
                                  task.isCompleted ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"
                                )}>{task.title}</h4>
                                {task.dueDate && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(task.dueDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end shrink-0">
                               <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider",
                                  task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                  task.priority === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                )}>
                                  {task.priority === "high" ? "Yüksek" : task.priority === "medium" ? "Orta" : "Düşük"}
                               </span>
                               <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Detay & Kanıt <ExternalLink className="w-3 h-3" />
                               </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {activeTab === "tools" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Araç Kütüphanesi</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Proje görevlerinizi yaparken kullanabileceğiniz Web 2.0 araçları ve eğitim uygulamaları.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">C</div>
                   <div>
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors">Canva</h4>
                     <p className="text-xs text-gray-500">Afiş, Logo & Tasarım</p>
                   </div>
                 </a>
                 <a href="https://padlet.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-500 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
                   <div>
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-pink-500 transition-colors">Padlet</h4>
                     <p className="text-xs text-gray-500">Dijital Pano & İşbirliği</p>
                   </div>
                 </a>
                 <a href="https://kahoot.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">K</div>
                   <div>
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-500 transition-colors">Kahoot!</h4>
                     <p className="text-xs text-gray-500">Oyun & Değerlendirme</p>
                   </div>
                 </a>
                 <a href="https://storyjumper.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">S</div>
                   <div>
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-500 transition-colors">StoryJumper</h4>
                     <p className="text-xs text-gray-500">Dijital Kitap Oluşturma</p>
                   </div>
                 </a>
                 <Link href="/dashboard/tools" className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-all sm:col-span-2 lg:col-span-1">
                    <Wrench className="w-4 h-4" /> Tüm Araçlara Git
                 </Link>
               </div>
            </div>
          )}

          {!isStudent && activeTab === "calendar" && (
            <div className="space-y-4">
              <CalendarView
                tasks={(project?.phases || []).flatMap((p: any) => p.tasks || [])}
                onTaskClick={handleTaskClick}
              />
            </div>
          )}

          {!isStudent && activeTab === "quality-label" && (
            <QualityLabelPanel projectId={projectId} project={project} />
          )}

          {activeTab === "evidence" && (
            <EvidencePanel projectId={projectId} project={project} onUpdate={fetchProject} />
          )}

          {activeTab === "chat" && (
            <ChatPanel projectId={projectId} projectMembers={project.members || []} />
          )}

          {!isStudent && activeTab === "members" && (
            <MembersPanel projectId={projectId} projectMembers={project.members || []} onUpdate={fetchProject} />
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
