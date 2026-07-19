"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  identifier: z.string().min(1, "E-posta veya kullanıcı adı gereklidir"),
  password: z.string().min(1, "Şifre gereklidir").min(6, "Şifre en az 6 karakter olmalıdır"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    // Validate with zod manually
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: data.identifier,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Giriş başarılı!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Giriş sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl shadow-blue-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            eTwin Asistan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            eTwinning projelerinizi kolayca yönetin
          </p>
        </div>

        {/* Card */}
        <div className="relative">
          {/* Glassmorphism card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Giriş Yap
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Identifier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  E-posta veya Kullanıcı Adı
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    {...register("identifier", {
                      required: "E-posta veya kullanıcı adı gereklidir",
                    })}
                    placeholder="ornek@email.com veya ogrenci_1"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Şifre
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline transition-colors">
                    Şifremi Unuttum?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Şifre gereklidir",
                      minLength: {
                        value: 6,
                        message: "Şifre en az 6 karakter olmalıdır",
                      },
                    })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/80 dark:bg-gray-900/80 text-gray-400">
                  veya
                </span>
              </div>
            </div>

            {/* Google OAuth (disabled) */}
            <button
              disabled
              className="relative w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 text-sm font-medium cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google ile Giriş Yap
              <span className="absolute top-1 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                Yakında
              </span>
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Hesabınız yok mu?{" "}
              <Link
                href="/auth/register"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
