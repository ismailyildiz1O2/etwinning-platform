"use client";

import { cn, getInitials, formatDate, getPriorityColor, getPriorityLabel } from "@/lib/utils";
import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";
import {
  X,
  Save,
  User,
  Tag,
  Calendar,
  MessageSquare,
  Clock,
  Trash2,
  Plus,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  File as FileIcon,
  Sparkles,
  Lightbulb,
  BookOpen,
  Wrench,
  Gamepad2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Check,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface TaskDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  projectMembers?: { id: string; name: string; email: string }[];
}

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
  tags: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string } | null;
  notes: {
    id: string;
    content: string;
    createdAt: string;
    user: { name: string };
  }[];
  files?: FileData[];
  isCompleted: boolean;
  phase?: {
    id: string;
    title: string;
    project?: {
      name: string;
    };
  };
}

interface FileData {
  id: string;
  name: string;
  url: string;
  fileType: string;
  uploadedAt: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: "tip" | "resource" | "activity" | "tool";
  icon: string;
}

const SUGGESTION_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tip: { bg: "bg-amber-100/80 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "İpucu" },
  resource: { bg: "bg-blue-100/80 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Kaynak" },
  activity: { bg: "bg-green-100/80 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Aktivite" },
  tool: { bg: "bg-purple-100/80 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Araç" },
};

const FILE_TYPE_ICONS: Record<string, { icon: typeof FileIcon; color: string }> = {
  image: { icon: ImageIcon, color: "text-pink-500" },
  video: { icon: Video, color: "text-red-500" },
  pdf: { icon: FileText, color: "text-orange-500" },
  audio: { icon: Gamepad2, color: "text-green-500" },
  document: { icon: FileIcon, color: "text-blue-500" },
};

export function TaskDrawer({
  taskId,
  isOpen,
  onClose,
  projectMembers = [],
}: TaskDrawerProps) {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setPriority(data.priority);
      setDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
      setAssigneeId(data.assigneeId || "");
      setTagsInput(
        (() => {
          try {
            return JSON.parse(data.tags || "[]").join(",");
          } catch {
            return "";
          }
        })()
      );
    } catch {
      toast.error("Görev bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchFiles = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/files`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiles(data);
    } catch {
      // Silently fail - files section just shows empty
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask();
      fetchFiles();
      // Reset suggestions when opening a new task
      setSuggestions([]);
      setSuggestionsLoaded(false);
      setSuggestionsExpanded(true);
      setAddedSuggestions(new Set());
      setAddingSuggestionId(null);
    }
  }, [isOpen, taskId, fetchTask, fetchFiles]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // ── File Handlers ──

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || !taskId) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const filesToUpload = Array.from(fileList);

    for (const file of filesToUpload) {
      if (file.size > maxSize) {
        toast.error(`"${file.name}" dosyası 10MB'dan büyük`);
        continue;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/tasks/${taskId}/files`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Dosya yüklenemedi");
        }

        toast.success(`"${file.name}" yüklendi`);
        fetchFiles();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Dosya yüklenemedi"
        );
      } finally {
        setUploading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) throw new Error();
      toast.success(`"${fileName}" silindi`);
      fetchFiles();
    } catch {
      toast.error("Dosya silinemedi");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // ── AI Suggestion Handler ──

  const handleGetSuggestions = async () => {
    if (!task) return;
    setLoadingSuggestions(true);
    setSuggestionsExpanded(true);
    try {
      const res = await fetch("/api/ai/task-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          phaseTitle: task.phase?.title,
          projectName: task.phase?.project?.name,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setSuggestionsLoaded(true);
      setAddedSuggestions(new Set());
    } catch {
      toast.error("AI önerileri alınamadı");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestionAsTask = async (suggestion: Suggestion) => {
    if (!task?.phase?.id) {
      toast.error("Görevin aşama bilgisi bulunamadı");
      return;
    }

    setAddingSuggestionId(suggestion.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId: task.phase.id,
          title: suggestion.text,
          priority: "medium",
          aiGenerated: true,
          parentId: taskId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Görev eklenemedi");
      }

      setAddedSuggestions((prev) => new Set(prev).add(suggestion.id));
      toast.success("Öneri görev olarak eklendi! ✅");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Görev eklenemedi"
      );
    } finally {
      setAddingSuggestionId(null);
    }
  };

  // ── Save & Note Handlers ──

  const handleSave = async () => {
    if (!taskId) return;
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
          tags: JSON.stringify(tags),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Görev güncellendi");
      fetchTask();
    } catch {
      toast.error("Görev güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!taskId || !newNote.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (!res.ok) throw new Error();
      setNewNote("");
      toast.success("Not eklendi");
      fetchTask();
    } catch {
      toast.error("Not eklenemedi");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Not silindi");
      fetchTask();
    } catch {
      toast.error("Not silinemedi");
    }
  };

  // ── Helpers ──

  const getFileIcon = (fileType: string) => {
    const config = FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.document;
    return config;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Görev Detayı
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Açıklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                Öncelik
              </label>
              <div className="mt-2 flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      priority === p
                        ? getPriorityColor(p) + " ring-2 ring-offset-1 ring-current/20"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {getPriorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Son Tarih
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Atanan Kişi
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="">Atanmadı</option>
                {projectMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags (Quality Label Criteria) */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Kalite Etiketi Kriterleri
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUALITY_LABEL_CRITERIA.map((criteria) => {
                  const currentTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
                  const isSelected = currentTags.includes(criteria.id);
                  return (
                    <button
                      key={criteria.id}
                      onClick={() => {
                        if (isSelected) {
                          setTagsInput(currentTags.filter(t => t !== criteria.id).join(","));
                        } else {
                          setTagsInput([...currentTags, criteria.id].join(","));
                        }
                      }}
                      title={criteria.description}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        isSelected
                          ? criteria.color + " border-transparent ring-2 ring-offset-1 ring-current/20"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {criteria.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══════════════ FILES SECTION ═══════════════ */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Paperclip className="w-3.5 h-3.5" />
                Dosyalar
                {files.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    {files.length}
                  </span>
                )}
              </label>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {files.map((file) => {
                    const iconConfig = getFileIcon(file.fileType);
                    const IconComponent = iconConfig.icon;
                    return (
                      <div
                        key={file.id}
                        className="group flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm", iconConfig.color)}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.fileType === "image" && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Görüntüle"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-500 transition-colors"
                            title="İndir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Image preview for uploaded images */}
              {files.filter((f) => f.fileType === "image").length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {files
                    .filter((f) => f.fileType === "image")
                    .map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-blue-400 transition-all"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                </div>
              )}

              {/* Upload area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer",
                  dragOver
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-1">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <p className="text-xs text-blue-500 font-medium">Yükleniyor...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-blue-500">Dosya seçin</span>{" "}
                      veya sürükleyip bırakın
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Fotoğraf, video, PDF, belge (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Quick upload buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                      // Reset accept after click
                      setTimeout(() => {
                        if (fileInputRef.current)
                          fileInputRef.current.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip";
                      }, 100);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 hover:border-pink-300 dark:hover:border-pink-700 transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Fotoğraf
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "video/*";
                      fileInputRef.current.click();
                      setTimeout(() => {
                        if (fileInputRef.current)
                          fileInputRef.current.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip";
                      }, 100);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700 transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  Video
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";
                      fileInputRef.current.click();
                      setTimeout(() => {
                        if (fileInputRef.current)
                          fileInputRef.current.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip";
                      }, 100);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 hover:border-orange-300 dark:hover:border-orange-700 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Belge
                </button>
              </div>
            </div>

            {/* ═══════════════ AI SUGGESTIONS SECTION ═══════════════ */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  AI Önerileri
                </label>
                {suggestionsLoaded && suggestions.length > 0 && (
                  <button
                    onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {suggestionsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>

              {!suggestionsLoaded ? (
                /* Initial state — Get suggestions button */
                <button
                  onClick={handleGetSuggestions}
                  disabled={loadingSuggestions}
                  className="w-full group relative overflow-hidden rounded-xl border border-purple-200/50 dark:border-purple-700/30 bg-gradient-to-r from-purple-50/80 via-blue-50/80 to-indigo-50/80 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 p-4 text-left transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                      {loadingSuggestions ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {loadingSuggestions ? "Öneriler oluşturuluyor..." : "AI ile Öneriler Al"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Bu görev için yapılabilecekleri, araçları ve aktiviteleri öner
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                /* Suggestions loaded */
                <div className="space-y-2">
                  {suggestionsExpanded && (
                    <>
                      {suggestions.map((suggestion) => {
                        const typeConfig = SUGGESTION_TYPE_COLORS[suggestion.type] || SUGGESTION_TYPE_COLORS.tip;
                        return (
                          <div
                            key={suggestion.id}
                            className="group p-3 rounded-xl border border-gray-200/50 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-800/30 hover:border-purple-200 dark:hover:border-purple-700/50 transition-all duration-200"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="text-lg shrink-0 mt-0.5">
                                {suggestion.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {suggestion.text}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span
                                    className={cn(
                                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium",
                                      typeConfig.bg,
                                      typeConfig.text
                                    )}
                                  >
                                    {typeConfig.label}
                                  </span>
                                  {addedSuggestions.has(suggestion.id) ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100/80 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-medium">
                                      <Check className="w-3 h-3" />
                                      Eklendi
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleAddSuggestionAsTask(suggestion)}
                                      disabled={addingSuggestionId === suggestion.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-200/50 dark:border-blue-700/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 disabled:opacity-50"
                                    >
                                      {addingSuggestionId === suggestion.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <ListPlus className="w-3 h-3" />
                                      )}
                                      Görev Ekle
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Regenerate button */}
                      <button
                        onClick={handleGetSuggestions}
                        disabled={loadingSuggestions}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-600 dark:hover:text-purple-400 transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                      >
                        {loadingSuggestions ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        {loadingSuggestions ? "Yenileniyor..." : "Yeniden Öner"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ═══════════════ NOTES SECTION ═══════════════ */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Notlar
              </label>

              {task?.notes && task.notes.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {task.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[8px] font-bold">
                            {getInitials(note.user.name)}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {note.user.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Henüz not eklenmemiş
                </p>
              )}

              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Not ekle..."
                  rows={2}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="self-end px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ═══════════════ ACTIVITY TIMELINE ═══════════════ */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Aktivite
              </label>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>Görev oluşturuldu</span>
                </div>
                {files.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <span>{files.length} dosya yüklendi</span>
                  </div>
                )}
                {task?.isCompleted && (
                  <div className="flex items-start gap-2 text-xs text-green-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <span>Görev tamamlandı</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </>
  );
}
