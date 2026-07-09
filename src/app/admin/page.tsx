"use client";

import { useState, useEffect } from "react";
import { Users, FolderGit2, CheckSquare, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalFiles: number;
  activeProjects: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Paneli
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Sistem istatistiklerini ve platform durumunu görüntüleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Kullanıcı"
          value={stats?.totalUsers}
          loading={loading}
          icon={Users}
          color="bg-blue-500"
          link="/admin/users"
        />
        <StatCard
          title="Aktif Projeler"
          value={stats?.activeProjects}
          subValue={`Toplam ${stats?.totalProjects} proje`}
          loading={loading}
          icon={FolderGit2}
          color="bg-green-500"
          link="/admin/projects"
        />
        <StatCard
          title="Oluşturulan Görevler"
          value={stats?.totalTasks}
          loading={loading}
          icon={CheckSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="Yüklenen Dosyalar"
          value={stats?.totalFiles}
          loading={loading}
          icon={FileText}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link
          href="/admin/users"
          className="group block p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kullanıcıları görüntüleyin, rollerini güncelleyin veya hesapları askıya alın.</p>
        </Link>

        <Link
          href="/admin/projects"
          className="group block p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-green-300 dark:hover:border-green-700 transition-all shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <FolderGit2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Proje Yönetimi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tüm projeleri listeleyin, detaylarını görün veya sistemden kaldırın.</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subValue,
  loading, 
  icon: Icon, 
  color,
  link
}: { 
  title: string; 
  value?: number; 
  subValue?: string;
  loading: boolean; 
  icon: any; 
  color: string;
  link?: string;
}) {
  const content = (
    <div className={`p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm ${link ? 'hover:border-blue-300 dark:hover:border-blue-700 transition-colors group' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {value?.toLocaleString() || "0"}
              </h3>
              {subValue && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{subValue}</span>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link} className="block">{content}</Link>;
  }

  return content;
}
