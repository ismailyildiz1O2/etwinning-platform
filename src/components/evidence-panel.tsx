"use client";

import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { FileText, Image as ImageIcon, Video, Gamepad2, File as FileIcon, ExternalLink, Link as LinkIcon, Plus, Loader2, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EvidencePanelProps {
  projectId: string;
  project: any;
  onUpdate: () => void;
}

const FILE_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  image: { icon: ImageIcon, color: "text-pink-500" },
  video: { icon: Video, color: "text-red-500" },
  pdf: { icon: FileText, color: "text-orange-500" },
  audio: { icon: Gamepad2, color: "text-green-500" },
  document: { icon: FileIcon, color: "text-blue-500" },
  link: { icon: LinkIcon, color: "text-indigo-500" },
};

export function EvidencePanel({ projectId, project, onUpdate }: EvidencePanelProps) {
  const [filter, setFilter] = useState<string>("all");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  // Collect all files from all tasks
  const allFiles: any[] = [];
  (project?.phases || []).forEach((phase: any) => {
    phase.tasks.forEach((task: any) => {
      if (task.files) {
        task.files.forEach((file: any) => {
          allFiles.push({
            ...file,
            taskTitle: task.title,
            phaseTitle: phase.title,
            taskTags: JSON.parse(task.tags || "[]")
          });
        });
      }
    });
  });

  const filteredFiles = allFiles.filter(file => {
    if (filter === "all") return true;
    let fileTags: string[] = [];
    let taskTags: string[] = [];
    try { 
      const parsed = JSON.parse(file.tags || "[]");
      fileTags = Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
    try { 
      taskTags = Array.isArray(file.taskTags) ? file.taskTags : [];
    } catch (e) {}
    return fileTags.includes(filter) || taskTags.includes(filter);
  });

  const handleAddLink = async () => {
    if (!linkUrl || !linkName) {
      toast.error("Lütfen bağlantı adı ve URL'sini girin");
      return;
    }
    
    // Find the first phase and first task to attach this generic project evidence to.
    // In a real scenario, evidence should be attached to a project directly or a specific task.
    // Since our File model requires a taskId, we will attach it to the first available task, 
    // or tell the user to add it from a task.
    const firstTask = project.phases[0]?.tasks[0];
    if (!firstTask) {
      toast.error("Lütfen önce bir görev oluşturun.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/tasks/${firstTask.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: linkName,
          url: linkUrl,
          isExternal: true,
          tags: JSON.stringify(linkTags),
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Dış bağlantı kanıt olarak eklendi!");
      setLinkUrl("");
      setLinkName("");
      setLinkTags([]);
      setIsAddingLink(false);
      onUpdate();
    } catch {
      toast.error("Bağlantı eklenemedi.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, taskId: string, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Bu kanıtı silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) throw new Error();
      toast.success("Kanıt başarıyla silindi");
      onUpdate();
    } catch {
      toast.error("Kanıt silinemedi");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === "all" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
          >
            Tümü ({allFiles.length})
          </button>
          {QUALITY_LABEL_CRITERIA.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === c.id ? c.color.split(" ")[0] + " " + c.color.split(" ")[1] + " ring-2 ring-current/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsAddingLink(!isAddingLink)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Dış Bağlantı Ekle
        </button>
      </div>

      {isAddingLink && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Bağlantı Adı</label>
              <input
                type="text"
                value={linkName}
                onChange={e => setLinkName(e.target.value)}
                placeholder="Örn: Padlet Etkinlik Duvarı"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://padlet.com/..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Etiketler (İsteğe Bağlı)</label>
            <div className="flex flex-wrap gap-2">
              {QUALITY_LABEL_CRITERIA.map((criteria) => {
                const isSelected = linkTags.includes(criteria.id);
                return (
                  <button
                    key={criteria.id}
                    onClick={() => {
                      if (isSelected) setLinkTags(linkTags.filter(t => t !== criteria.id));
                      else setLinkTags([...linkTags, criteria.id]);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                      isSelected
                        ? criteria.color + " border-transparent ring-2 ring-offset-1 ring-current/20"
                        : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700"
                    )}
                  >
                    {criteria.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingLink(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              İptal
            </button>
            <button
              onClick={handleAddLink}
              disabled={adding}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-2"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Ekle
            </button>
          </div>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <FileIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Bu kritere uygun kanıt bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const isExternal = file.isExternal;
            const iconConfig = isExternal ? FILE_TYPE_ICONS.link : (FILE_TYPE_ICONS[file.fileType] || FILE_TYPE_ICONS.document);
            const Icon = iconConfig.icon;
            
            let fileTags: string[] = [];
            let taskTags: string[] = [];
            try { 
              const parsed = JSON.parse(file.tags || "[]");
              fileTags = Array.isArray(parsed) ? parsed : [];
            } catch (e) {}
            try { 
              taskTags = Array.isArray(file.taskTags) ? file.taskTags : [];
            } catch (e) {}
            const combinedTags = Array.from(new Set([...fileTags, ...taskTags]));

            return (
              <div
                key={file.id}
                className="group flex flex-col p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all relative"
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0 rounded-xl" aria-label={file.name} />
                <div className="flex items-start gap-3 mb-3 relative z-10 pointer-events-none">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 dark:bg-gray-800", iconConfig.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5" title={file.taskTitle}>
                      {file.taskTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1">
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                    <button
                      onClick={(e) => handleDeleteFile(e, file.taskId, file.id)}
                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10 pointer-events-none">
                  <span className="text-[10px] text-gray-400">{formatDate(file.uploadedAt)}</span>
                  <div className="flex -space-x-1">
                    {combinedTags.map((tagId: string) => {
                      const criteria = QUALITY_LABEL_CRITERIA.find(c => c.id === tagId);
                      if (!criteria) return null;
                      return (
                        <div
                          key={tagId}
                          title={criteria.label}
                          className={cn("w-3 h-3 rounded-full border border-white dark:border-gray-900", criteria.color.split(" ")[1])}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
