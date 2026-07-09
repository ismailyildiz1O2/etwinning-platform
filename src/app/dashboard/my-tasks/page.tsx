"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Circle, Clock, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null;
  phase: {
    project: {
      id: string;
      name: string;
    }
  }
}

export default function MyTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/tasks?assigneeId=${session.user.id}`)
        .then(res => res.json())
        .then(data => setTasks(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session?.user?.id]);

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Görevlerim</h1>
          <p className="text-gray-500">Bana atanan tüm görevler</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Bekleyen Görevler
          </h2>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">Bekleyen göreviniz bulunmuyor. Harika!</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(task.id, task.isCompleted)} className="mt-1 text-gray-400 hover:text-green-500 transition-colors">
                    <Circle className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.phase?.project?.name}</p>
                    {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
                    {task.dueDate && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100">
                        Son Tarih: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Tamamlanan Görevler
          </h2>
          <div className="space-y-3 opacity-75">
            {completedTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz tamamlanan bir göreviniz yok.</p>
            ) : (
              completedTasks.map(task => (
                <div key={task.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shadow-sm flex items-start gap-3">
                  <button onClick={() => handleToggleComplete(task.id, task.isCompleted)} className="mt-1 text-green-500 hover:text-gray-400 transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="line-through text-gray-500">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm">{task.phase?.project?.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
