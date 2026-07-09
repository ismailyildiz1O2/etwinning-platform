"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, Search, Shield, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  deletedAt: string | null;
  _count: { projects: number; tasks: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error("Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rol güncellenemedi");
      }
      toast.success("Kullanıcı rolü güncellendi");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rol güncellenemedi");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleSuspend = async (userId: string, isSuspended: boolean) => {
    if (!confirm(`Bu kullanıcıyı ${isSuspended ? 'askıya almak' : 'aktif etmek'} istediğinize emin misiniz?`)) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "İşlem başarısız");
      }
      toast.success(isSuspended ? "Kullanıcı askıya alındı" : "Kullanıcı aktif edildi");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Platformdaki tüm kullanıcıları yönetin.
          </p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Kullanıcı</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                  <th className="px-6 py-4 font-medium">Kayıt Tarihi</th>
                  <th className="px-6 py-4 font-medium">İstatistikler</th>
                  <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Kullanıcı bulunamadı.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email || "E-posta yok"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        disabled={updating === user.id}
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="student">Öğrenci</option>
                        <option value="teacher">Öğretmen</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {user.deletedAt ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Ban className="w-3.5 h-3.5" /> Askıda
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <span className="block text-xs">{user._count.projects} Proje</span>
                      <span className="block text-xs">{user._count.tasks} Görev</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        disabled={updating === user.id}
                        onClick={() => handleToggleSuspend(user.id, !user.deletedAt)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
                          user.deletedAt
                            ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        )}
                      >
                        {updating === user.id ? "İşleniyor..." : (user.deletedAt ? "Aktif Et" : "Askıya Al")}
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
