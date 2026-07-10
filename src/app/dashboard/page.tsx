"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { TodayTasks } from "@/components/today-tasks";
import { StatsCards } from "@/components/stats-cards";
import { EmptyState } from "@/components/empty-state";
import { Plus, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  phases: {
    order: number;
    tasks: { isCompleted: boolean }[];
  }[];
}

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data: Project[] = await res.json();
        
        // Filter out archived projects for main dashboard
        const activeProjects = data.filter(p => p.status !== "archived");
        setProjects(activeProjects);

        // Calculate stats based on active projects
        const totalProjects = activeProjects.length;
        const totalTasks = activeProjects.reduce(
          (sum, p) => sum + p.phases.reduce((s, ph) => s + (ph.tasks?.length ?? 0), 0),
          0
        );
        const completedTasks = activeProjects.reduce(
          (sum, p) =>
            sum +
            p.phases.reduce(
              (s, ph) => s + (ph.tasks?.filter((t) => t.isCompleted).length ?? 0),
              0
            ),
          0
        );
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({ totalProjects, totalTasks, completedTasks, completionRate });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);


  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {/* Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-10 w-40 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ana Sayfa
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Projelerinize genel bakış
          </p>
        </div>
        <button
          onClick={() => router.push("/projects/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Yeni Proje Oluştur
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projeler
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onUpdate={fetchDashboard} 
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="Henüz projeniz yok"
              description="İlk eTwinning projenizi oluşturarak başlayın"
              action={{
                label: "Proje Oluştur",
                onClick: () => router.push("/projects/new"),
              }}
            />
          )}
        </div>

        {/* Today's tasks */}
        <div>
          <TodayTasks />
        </div>
      </div>


    </div>
  );
}
