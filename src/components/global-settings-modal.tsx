"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  X,
  User,
  Shield,
  Palette,
  Bell,
  Camera,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "profile" | "security" | "appearance" | "notifications";
}

export function GlobalSettingsModal({ isOpen, onClose, defaultTab = "profile" }: GlobalSettingsModalProps) {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme, systemTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Notifications State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  useEffect(() => {
    if (session?.user && isOpen) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setImage(session.user.image || null);
      
      // Load mock notification settings from localStorage
      const savedNotifs = localStorage.getItem("etwin_notifs");
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        setEmailNotifs(parsed.email ?? true);
        setPushNotifs(parsed.push ?? true);
      }
    }
  }, [session, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, image }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Profil güncellenemedi");
      }

      await updateSession();
      toast.success("Profiliniz başarıyla güncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Lütfen tüm şifre alanlarını doldurun");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır");
      return;
    }

    setIsSavingSecurity(true);
    try {
      const res = await fetch("/api/user/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Şifre güncellenemedi");
      }

      toast.success("Şifreniz başarıyla değiştirildi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleSaveNotifications = () => {
    setIsSavingNotifs(true);
    setTimeout(() => {
      localStorage.setItem("etwin_notifs", JSON.stringify({ email: emailNotifs, push: pushNotifs }));
      toast.success("Bildirim tercihleriniz kaydedildi");
      setIsSavingNotifs(false);
    }, 500);
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Güvenlik", icon: Shield },
    { id: "appearance", label: "Görünüm", icon: Palette },
    { id: "notifications", label: "Bildirimler", icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[600px] animate-in zoom-in-95 duration-200">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hesap Ayarları</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 bg-[#F8F9FA] dark:bg-[#121824] border-r border-gray-200 dark:border-white/10 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <div className="hidden md:flex items-center justify-between p-6 pb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ayarlar</h2>
          </div>
          
          <div className="flex md:flex-col p-2 md:p-4 gap-1 min-w-max md:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm md:border md:border-gray-200/50 dark:md:border-gray-700/50" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-blue-600/20 dark:fill-blue-400/20")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1E293B] relative">
          <div className="hidden md:block absolute top-6 right-6 z-10">
            <button 
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8 md:pt-12 max-w-2xl">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h3>
                  <p className="text-sm text-gray-500 mt-1">Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin.</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative group">
                    {image ? (
                      <img src={image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 dark:border-gray-800 shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-50 dark:border-gray-800 shadow-md">
                        {getInitials(name || "U")}
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 shadow-lg border border-gray-200 dark:border-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Profil Fotoğrafı</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">JPG, GIF veya PNG. Maksimum 2MB.</p>
                    {image && (
                      <button onClick={() => setImage(null)} className="text-xs text-red-500 font-medium mt-2 hover:underline">
                        Fotoğrafı Kaldır
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ad Soyad</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-posta Adresi</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !name.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Güvenlik</h3>
                  <p className="text-sm text-gray-500 mt-1">Hesabınızın güvenliğini sağlamak için şifrenizi güncelleyin.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mevcut Şifre</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Yeni Şifre</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Yeni Şifre (Tekrar)</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveSecurity}
                    disabled={isSavingSecurity || !currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25"
                  >
                    {isSavingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Şifreyi Güncelle
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Görünüm</h3>
                  <p className="text-sm text-gray-500 mt-1">Platformun nasıl görüneceğini özelleştirin.</p>
                </div>

                {mounted && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tema Tercihi</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Light Theme */}
                      <button 
                        onClick={() => setTheme("light")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
                          theme === "light" 
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600" 
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <Sun className={cn("w-8 h-8", theme === "light" && "fill-blue-600/20")} />
                        <span className="font-medium">Aydınlık</span>
                      </button>

                      {/* Dark Theme */}
                      <button 
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
                          theme === "dark" 
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600" 
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <Moon className={cn("w-8 h-8", theme === "dark" && "fill-blue-600/20")} />
                        <span className="font-medium">Karanlık</span>
                      </button>

                      {/* System Theme */}
                      <button 
                        onClick={() => setTheme("system")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
                          theme === "system" 
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600" 
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <Monitor className={cn("w-8 h-8", theme === "system" && "fill-blue-600/20")} />
                        <span className="font-medium">Sistem</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Sistem seçeneği, işletim sisteminizin mevcut karanlık/aydınlık ayarlarına uyum sağlar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Bildirimler</h3>
                  <p className="text-sm text-gray-500 mt-1">Hangi durumlarda haber almak istediğinizi seçin.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">E-posta Bildirimleri</h4>
                      <p className="text-xs text-gray-500 mt-1">Yeni görev atandığında veya önemli projelerde mesaj geldiğinde e-posta alın.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Anlık Bildirimler (Push)</h4>
                      <p className="text-xs text-gray-500 mt-1">Tarayıcı üzerinden uygulamanın size anlık bildirim göndermesine izin verin.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" className="sr-only peer" checked={pushNotifs} onChange={(e) => setPushNotifs(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifs}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25"
                  >
                    {isSavingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Tercihleri Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
