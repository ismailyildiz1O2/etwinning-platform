"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import {
  Save,
  Trash2,
  AlertTriangle,
  UserPlus,
  Loader2,
  Mail,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectSettings {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  country: string | null;
  partnerSchools: string;
  twinspaceUrl: string | null;
  members: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; image: string | null };
  }[];
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Student form
  const [studentName, setStudentName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [country, setCountry] = useState("");
  const [partnerSchools, setPartnerSchools] = useState("");
  const [twinspaceUrl, setTwinspaceUrl] = useState("");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProject(data);
      setName(data.name);
      setDescription(data.description || "");
      setStartDate(data.startDate?.split("T")[0] || "");
      setEndDate(data.endDate?.split("T")[0] || "");
      setCountry(data.country || "");
      try {
        setPartnerSchools(JSON.parse(data.partnerSchools || "[]").join(", "));
      } catch {
        setPartnerSchools("");
      }
      setTwinspaceUrl(data.twinspaceUrl || "");
    } catch {
      toast.error("Proje yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          startDate,
          endDate,
          country,
          partnerSchools: partnerSchools
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          twinspaceUrl,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Proje güncellendi");
    } catch {
      toast.error("Proje güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Davet gönderilemedi");
      }
      toast.success("Üye davet edildi");
      setInviteEmail("");
      fetchProject();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Davet gönderilemedi");
    } finally {
      setInviting(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!studentName.trim() || !studentUsername.trim() || !studentPassword.trim()) return;
    setCreatingStudent(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: studentName, username: studentUsername, password: studentPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Öğrenci hesabı oluşturulamadı");
      }
      toast.success("Öğrenci hesabı oluşturuldu ve projeye eklendi!");
      setStudentName("");
      setStudentUsername("");
      setStudentPassword("");
      fetchProject();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Öğrenci hesabı oluşturulamadı");
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Bu projeyi arşivlemek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Proje arşivlendi");
      router.push("/dashboard");
    } catch {
      toast.error("Proje arşivlenemedi");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!"
      )
    )
      return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Proje silindi");
      router.push("/dashboard");
    } catch {
      toast.error("Proje silinemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Proje bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Proje Ayarları
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Proje bilgilerini ve üyeleri yönetin
        </p>
      </div>

      {/* Project Info */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Proje Bilgileri
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proje Adı
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Açıklama
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Başlangıç
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bitiş
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ülke
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ortak Okullar
          </label>
          <input
            type="text"
            value={partnerSchools}
            onChange={(e) => setPartnerSchools(e.target.value)}
            placeholder="Virgülle ayırın"
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            TwinSpace URL
          </label>
          <input
            type="url"
            value={twinspaceUrl}
            onChange={(e) => setTwinspaceUrl(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
        >
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {/* Members */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Üyeler
        </h2>

        <div className="space-y-2">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(member.user.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                  member.role === "owner"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : member.role === "student"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}
              >
                <Shield className="w-3 h-3" />
                {member.role === "owner" ? "Sahip" : member.role === "student" ? "Öğrenci" : "Üye"}
              </span>
            </div>
          ))}
        </div>

        {/* Invite */}
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email adresi girin"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
          >
            <UserPlus className="w-4 h-4" />
            {inviting ? "Davet ediliyor..." : "Üye Davet Et"}
          </button>
        </div>
      </div>

      {/* Öğrenci Yönetimi */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Öğrenci Yönetimi
          </h2>
          <p className="text-sm text-gray-500 mt-1">Öğrencilerin e-posta adresi olmadan projeye erişebilmesi için buradan onlara hesap oluşturun. Şifreyi öğrenciye vermeyi unutmayın.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Öğrenci Adı
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Örn: Ali Yılmaz"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Öğrenci Kodu (Kullanıcı Adı)
            </label>
            <input
              type="text"
              value={studentUsername}
              onChange={(e) => setStudentUsername(e.target.value)}
              placeholder="Örn: aliyilmaz_tr"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Geçici Şifre
            </label>
            <input
              type="text"
              value={studentPassword}
              onChange={(e) => setStudentPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCreateStudent}
            disabled={creatingStudent || !studentName.trim() || !studentUsername.trim() || studentPassword.length < 6}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
          >
            <UserPlus className="w-4 h-4" />
            {creatingStudent ? "Oluşturuluyor..." : "Öğrenci Hesabı Oluştur"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200/80 dark:border-red-800/30 bg-red-50/50 dark:bg-red-950/10 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Tehlikeli Bölge
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleArchive}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            Projeyi Arşivle
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Projeyi Sil
          </button>
        </div>
      </div>
    </div>
  );
}
