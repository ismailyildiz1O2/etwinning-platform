"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token || !email) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Geçersiz İstek</AlertTitle>
        <AlertDescription>
          Şifre sıfırlama bağlantısı eksik veya hatalı. Lütfen e-postanızdaki bağlantıya tekrar tıklayın veya yeni bir sıfırlama isteği gönderin.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifreniz en az 6 karakter olmalıdır.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Tebrikler!</AlertTitle>
          <AlertDescription>Şifreniz başarıyla güncellendi.</AlertDescription>
        </Alert>
        <Button className="w-full" onClick={() => router.push("/auth/login")}>
          Giriş Yap <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">Yeni Şifre</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Yeni Şifre Belirle</CardTitle>
          <CardDescription>Hesabınız için yeni ve güvenli bir şifre oluşturun.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-4">Yükleniyor...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
