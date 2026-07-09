"use client";

import { useState, useEffect } from "react";
import { FolderGit2, Loader2, Search, Ban, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  deletedAt: string | null;
  _count: { members: number; phases: number };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      toast.error("Projeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    setUpdating(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Durum güncellenemedi");
      }
      toast.success("Proje durumu güncellendi");
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Durum güncellenemedi");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleDelete = async (projectId: string, isDeleted: boolean) => {
    if (!confirm(`Bu projeyi ${isDeleted ? 'silmek' : 'geri getirmek'} istediğinize emin misiniz?`)) return;
    setUpdating(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "İşlem başarısız");
      }
      toast.success(isDeleted ? "Proje silindi (çöp kutusunda)" : "Proje aktif edildi");
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setUpdating(null);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-green-500" />
            Proje Yönetimi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Platformdaki tüm projeleri yönetin.
          </p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Proje Adı</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                  <th className="px-6 py-4 font-medium">Oluşturulma</th>
                  <th className="px-6 py-4 font-medium">İstatistikler</th>
                  <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Proje bulunamadı.
                    </td>
                  </tr>
                )}
                {filteredProjects.map((project) => (
                  <tr key={project.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors", project.deletedAt ? "opacity-60" : "")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                          <FolderGit2 className="w-5 h-5" />
                        </div>
                        <div>
                          <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-xs text-gray-500 w-48 truncate">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        disabled={updating === project.id || !!project.deletedAt}
                        value={project.status}
                        onChange={(e) => handleUpdateStatus(project.id, e.target.value)}
                        className={cn("bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-2 py-1 focus:ring-2 focus:ring-green-500 disabled:opacity-50", getStatusColor(project.status))}
                      >
                        <option value="planning">Planlanıyor</option>
                        <option value="active">Aktif</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="on-hold">Beklemede</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <span className="block text-xs">{project._count.members} Üye</span>
                      <span className="block text-xs">{project._count.phases} Aşama</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        disabled={updating === project.id}
                        onClick={() => handleToggleDelete(project.id, !project.deletedAt)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
                          project.deletedAt
                            ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        )}
                      >
                        {updating === project.id ? "İşleniyor..." : (project.deletedAt ? "Geri Getir" : "Sil")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
