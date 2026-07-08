"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Trash2, Edit3, Send, NotebookText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotesDrawerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export function NotesDrawer({ projectId, isOpen, onClose }: NotesDrawerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("add");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      toast.error("Notlar yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchNotes();
      // varsayılan olarak Not Ekle sekmesi ile başlasın
      setActiveTab("add");
    } else {
      document.body.style.overflow = "";
      setNewNoteContent("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, fetchNotes]);

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Lütfen bir not yazın");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent }),
      });
      
      if (!res.ok) throw new Error();
      
      toast.success("Not kaydedildi");
      setNewNoteContent("");
      setActiveTab("list");
      fetchNotes();
    } catch (error) {
      toast.error("Not kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Not silindi");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      toast.error("Not silinirken bir hata oluştu");
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out border-l border-gray-200/50 dark:border-gray-800 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <NotebookText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notlar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("add")}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === "add"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Not Ekle
              </div>
              {activeTab === "add" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === "list"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              <div className="flex items-center gap-2">
                <NotebookText className="w-4 h-4" />
                Notlarım {notes.length > 0 && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{notes.length}</span>}
              </div>
              {activeTab === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "add" ? (
            <div className="space-y-4 h-full flex flex-col">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Notunuzu buraya yazın..."
                className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNote}
                  disabled={saving || !newNoteContent.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="group bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 relative"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">
                      {note.content}
                    </p>
                    
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      title="Notu sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <NotebookText className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Henüz not yok</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Eklediğiniz notlar burada listelenecek.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
