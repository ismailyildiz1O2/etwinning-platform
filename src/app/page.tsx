import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Sparkles,
  FolderKanban,
  Bot,
  Users,
  BarChart3,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />

      {/* Floating orbs */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 -right-20 w-[500px] h-[500px] bg-purple-400/15 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="fixed top-1/2 left-1/2 w-72 h-72 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      {/* Grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              eTwin Asistan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
            >
              Kayıt Ol
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 lg:px-12 pt-20 pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/30 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              eTwinning proje yönetiminde yeni dönem
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="text-blue-600 dark:text-blue-400">
              eTwin Asistan
            </span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto leading-relaxed">
            eTwinning Projelerinizi{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              Kolayca Yönetin
            </span>
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
            AI destekli görev önerileri, takım çalışması araçları ve ilerleme
            takibi ile eTwinning projelerinizi başarıya taşıyın.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Hemen Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Giriş Yap
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 lg:px-12 pb-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FolderKanban,
                title: "Proje Yönetimi",
                description:
                  "4 aşamalı eTwinning proje yapısıyla projelerinizi düzenli tutun",
                gradient: "from-blue-500 to-blue-600",
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
                iconColor: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: Bot,
                title: "AI Asistan",
                description:
                  "Yapay zeka destekli görev önerileri ve akıllı planlama",
                gradient: "from-purple-500 to-purple-600",
                iconBg: "bg-purple-100 dark:bg-purple-900/30",
                iconColor: "text-purple-600 dark:text-purple-400",
              },
              {
                icon: Users,
                title: "Takım Çalışması",
                description:
                  "Ortak okullarla kolay iletişim ve görev dağılımı",
                gradient: "from-green-500 to-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
                iconColor: "text-green-600 dark:text-green-400",
              },
              {
                icon: BarChart3,
                title: "İlerleme Takibi",
                description:
                  "Gerçek zamanlı ilerleme raporları ve tamamlanma oranları",
                gradient: "from-amber-500 to-amber-600",
                iconBg: "bg-amber-100 dark:bg-amber-900/30",
                iconColor: "text-amber-600 dark:text-amber-400",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800/50"
              >
                {/* Gradient decoration */}
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-[80px] transition-opacity group-hover:opacity-10`}
                />

                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-12 py-8 border-t border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                eTwin Asistan
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © 2026 eTwin Asistan. Tüm hakları saklıdır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
