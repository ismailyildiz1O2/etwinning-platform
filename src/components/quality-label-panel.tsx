"use client";

import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface QualityLabelPanelProps {
  projectId: string;
  project: any;
}

export function QualityLabelPanel({ projectId, project }: QualityLabelPanelProps) {
  const [draft, setDraft] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate stats for each criteria
  const stats = QUALITY_LABEL_CRITERIA.map(criteria => {
    let taskCount = 0;
    let fileCount = 0;
    const matchedTasks: any[] = [];
    const matchedFiles: any[] = [];

    project.phases.forEach((phase: any) => {
      phase.tasks.forEach((task: any) => {
        const checkTask = (t: any) => {
          let taskHasTag = false;
          try {
            const parsed = JSON.parse(t.tags || "[]");
            const tags = Array.isArray(parsed) ? parsed : [];
            if (tags.includes(criteria.id)) {
              taskCount++;
              taskHasTag = true;
              matchedTasks.push(t);
            }
          } catch { }

          // Count files if they have the tag themselves, or if their parent task has the tag
          t.files?.forEach((file: any) => {
             let fileHasTag = false;
             try {
               const parsed = JSON.parse(file.tags || "[]");
               const tags = Array.isArray(parsed) ? parsed : [];
               if (tags.includes(criteria.id)) {
                 fileHasTag = true;
               }
             } catch { }
             
             if (fileHasTag || taskHasTag) {
               fileCount++;
               matchedFiles.push({ ...file, taskTitle: t.title });
             }
          });
        };

        checkTask(task);
        if (task.subTasks) {
          task.subTasks.forEach(checkTask);
        }
      });
    });

    return {
      ...criteria,
      taskCount,
      fileCount,
      matchedTasks,
      matchedFiles,
      progress: Math.min(100, (taskCount * 15) + (fileCount * 10)), // simple heuristic
    };
  });

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/quality-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDraft(data.draft);
      toast.success("Başvuru taslağı oluşturuldu!");
    } catch {
      toast.error("Taslak oluşturulamadı.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success("Panoya kopyalandı");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kriter İlerlemesi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Görevlerinize eklediğiniz etiketlere göre Kalite Etiketi başvurusu için eksiklerinizi görün.
          </p>
        </div>

        <div className="grid gap-6">
          {stats.map((stat) => (
            <div key={stat.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("px-2 py-1 rounded-md text-xs font-medium", stat.color)}>
                    {stat.label}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.taskCount} görev, {stat.fileCount} kanıt
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  %{stat.progress}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", stat.color.split(" ")[1])}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
              {stat.progress < 50 && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Bu kriterde daha fazla etkinlik veya kanıt yüklemelisiniz.
                </p>
              )}
              
              {/* Kanıt Detayları */}
              {(stat.matchedTasks.length > 0 || stat.matchedFiles.length > 0) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stat.matchedTasks.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tamamlanan Görevler</h4>
                      <ul className="space-y-2">
                        {stat.matchedTasks.map((t: any) => (
                          <li key={t.id} className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              {t.isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              {t.title}
                            </div>
                            {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 ml-5">{t.description}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stat.matchedFiles.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Kanıt Dosyaları</h4>
                      <ul className="space-y-2">
                        {stat.matchedFiles.map((f: any) => (
                          <li key={f.id} className="text-sm">
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                              {f.name}
                            </a>
                            <p className="text-[10px] text-gray-400 mt-0.5">{f.taskTitle}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Başvuru Taslağı
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              Projenizdeki tüm görevleri, notları ve kanıtları analiz ederek Kalite Etiketi başvurusu için ilk taslağı oluşturur.
            </p>
          </div>
          <button
            onClick={handleGenerateDraft}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-purple-500/25"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Oluşturuluyor..." : "Taslak Oluştur"}
          </button>
        </div>

        {draft && (
          <div className="mt-6 relative group">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-2 bg-gray-900/80 hover:bg-gray-900 text-white rounded-lg backdrop-blur-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-96 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y font-mono leading-relaxed shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
}
