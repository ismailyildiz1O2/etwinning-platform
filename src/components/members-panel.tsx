"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Shield, GraduationCap, Building2, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MembersPanel({ projectId, projectMembers, onUpdate }: { projectId: string; projectMembers: any[]; onUpdate?: () => void }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || projectMembers.some(m => m.user.id === session?.user?.id && m.role !== "student");

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Student fields
  const [studentName, setStudentName] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Edit Student fields
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentUsername, setEditStudentUsername] = useState("");
  const [editStudentPassword, setEditStudentPassword] = useState("");

  // Removed teams fetching since we don't need it for dropdown anymore

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "admin" }),
      });

      if (res.ok) {
        alert("Öğretmen başarıyla eklendi / Davet gönderildi.");
        setIsTeacherModalOpen(false);
        setEmail("");
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(`Hata: ${data.error || "Bilinmeyen bir hata oluştu"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Sunucu ile iletişim kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentUsername || !studentPassword) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName, 
          username: studentUsername, 
          password: studentPassword
        }),
      });

      if (res.ok) {
        alert("Öğrenci başarıyla oluşturuldu ve projeye eklendi.");
        setIsStudentModalOpen(false);
        setStudentName("");
        setStudentUsername("");
        setStudentPassword("");
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(`Hata: ${data.error || "Bilinmeyen bir hata oluştu"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Sunucu ile iletişim kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentName || !editStudentUsername) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: editingStudentId,
          name: editStudentName, 
          username: editStudentUsername, 
          password: editStudentPassword
        }),
      });

      if (res.ok) {
        alert("Öğrenci bilgileri başarıyla güncellendi.");
        setIsEditStudentModalOpen(false);
        setEditingStudentId("");
        setEditStudentName("");
        setEditStudentUsername("");
        setEditStudentPassword("");
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(`Hata: ${data.error || "Bilinmeyen bir hata oluştu"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Sunucu ile iletişim kurulamadı.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (member: any) => {
    setEditingStudentId(member.user.id);
    setEditStudentName(member.user.name);
    setEditStudentUsername(member.user.username || "");
    setEditStudentPassword("");
    setIsEditStudentModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mt-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" /> Proje Üyeleri
        </h2>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => setIsStudentModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
            >
              <GraduationCap className="w-4 h-4" /> Öğrenci Ekle
            </button>
            <button 
              onClick={() => setIsTeacherModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" /> Öğretmen Davet Et
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectMembers.map((member: any) => (
          <div key={member.user.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900 transition-colors bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 overflow-hidden relative">
              {member.user.image ? (
                <img src={member.user.image} alt={member.user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                  {member.user.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{member.user.name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                {member.role === "student" ? (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <GraduationCap className="w-3 h-3" /> Öğrenci
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    <Shield className="w-3 h-3" /> Öğretmen
                  </span>
                )}
                {member.user.country && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {member.user.country}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && member.role === "student" && (
              <button 
                onClick={() => openEditModal(member)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Öğretmen Ekle Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Öğretmen Davet Et</h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Öğretmenin e-posta adresi"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Ekleniyor..." : "Davet Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Öğrenci Ekle Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Öğrenci Ekle</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Öğrencinin adı ve soyadı"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  placeholder="Örn: ahmet_yilmaz"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Şifre</label>
                <input
                  type="text"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || !studentName || !studentUsername || !studentPassword}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Oluşturuluyor..." : "Oluştur ve Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Öğrenci Düzenle Modal */}
      {isEditStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Öğrenciyi Düzenle</h3>
              <button onClick={() => setIsEditStudentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  placeholder="Öğrencinin adı ve soyadı"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={editStudentUsername}
                  onChange={(e) => setEditStudentUsername(e.target.value)}
                  placeholder="Örn: ahmet_yilmaz"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yeni Şifre (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={editStudentPassword}
                  onChange={(e) => setEditStudentPassword(e.target.value)}
                  placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || !editStudentName || !editStudentUsername}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Güncelleniyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
