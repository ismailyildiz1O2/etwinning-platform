"use client";

import { useState, useEffect } from "react";
import { FolderGit2, Loader2, Search, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, getStatusColor, getStatusLabel, useI18n } from "@/lib/utils";
import Link from "next/link";
import { useI18n as useAppI18n } from "@/components/i18n-provider";

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
  const { t, locale } = useAppI18n();
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
      toast.error("Failed to load projects");
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
        throw new Error(data.error || "Failed to update status");
      }
      toast.success("Project status updated");
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleDelete = async (projectId: string, isDeleted: boolean) => {
    const confirmMsg = isDeleted
      ? "Are you sure you want to move this project to trash? (Will auto-delete permanently in 30 days)"
      : "Are you sure you want to restore this project?";
    if (!confirm(confirmMsg)) return;

    setUpdating(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Operation failed");
      }
      toast.success(isDeleted ? "Moved to trash (Auto-deletes in 30 days)" : "Project restored successfully");
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setUpdating(null);
    }
  };

  const handlePermanentDelete = async (projectId: string, name: string) => {
    if (!confirm(`PERMANENT DELETE WARNING:\n\nAre you sure you want to permanently delete "${name}"? This action cannot be undone!`)) return;

    setUpdating(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Permanent delete failed");
      }
      toast.success("Project permanently deleted");
      fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete permanently");
    } finally {
      setUpdating(null);
    }
  };

  const getDaysRemainingInTrash = (deletedAtStr: string) => {
    const deletedDate = new Date(deletedAtStr);
    const diffMs = Date.now() - deletedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletedProjectsCount = projects.filter(p => p.deletedAt).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-green-500" />
            Project Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all projects on the platform. Soft-deleted items are permanently purged after 30 days.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {deletedProjectsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>
            <strong>{deletedProjectsCount}</strong> project(s) currently in Trash. They will be automatically permanently deleted after 30 days if not restored.
          </span>
        </div>
      )}

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
                  <th className="px-6 py-4 font-medium">Project Name</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Statistics</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}
                {filteredProjects.map((project) => {
                  const daysLeft = project.deletedAt ? getDaysRemainingInTrash(project.deletedAt) : null;

                  return (
                    <tr key={project.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors", project.deletedAt ? "bg-red-50/20 dark:bg-red-950/10" : "")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0", project.deletedAt ? "bg-gray-400 dark:bg-gray-700" : "bg-gradient-to-br from-green-500 to-emerald-600")}>
                            <FolderGit2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                {project.name}
                              </Link>
                              {project.deletedAt && (
                                <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[11px] font-medium">
                                  Trash ({daysLeft}d left)
                                </span>
                              )}
                            </div>
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
                          <option value="planning">Planning</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate(project.createdAt, undefined, locale)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <span className="block text-xs">{project._count.members} Members</span>
                        <span className="block text-xs">{project._count.phases} Phases</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {project.deletedAt ? (
                          <>
                            <button
                              disabled={updating === project.id}
                              onClick={() => handleToggleDelete(project.id, false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                            <button
                              disabled={updating === project.id}
                              onClick={() => handlePermanentDelete(project.id, project.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                              title="Permanently delete now"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Forever
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={updating === project.id}
                            onClick={() => handleToggleDelete(project.id, true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {updating === project.id ? "Processing..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
