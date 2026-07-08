"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { Archive, Plus } from "lucide-react";

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

export default function ArchivePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const fetchArchive = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data: Project[] = await res.json();
        // Sadece arşivlenmiş olanları filtrele
        const archivedProjects = data.filter(p => p.status === "archived");
        setProjects(archivedProjects);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Archive className="w-6 h-6 text-gray-500" />
            Arşivlenmiş Projeler
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Geçmiş projelerinizi buradan görüntüleyebilirsiniz
          </p>
        </div>
      </div>

      {/* Main content */}
      <div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onUpdate={fetchArchive} 
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Archive}
            title="Arşiviniz boş"
            description="Henüz arşive kaldırdığınız bir proje bulunmuyor."
            action={{
              label: "Yeni Proje Oluştur",
              onClick: () => router.push("/projects/new"),
            }}
          />
        )}
      </div>
    </div>
  );
}
