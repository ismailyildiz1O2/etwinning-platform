"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
          <CardDescription>
            Hesabınıza kayıtlı e-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Başarılı!</AlertTitle>
              <AlertDescription>
                Eğer sistemimizde bu e-posta adresine ait bir hesap varsa, şifre sıfırlama bağlantısı gönderilmiştir. Lütfen e-posta kutunuzu (ve spam klasörünü) kontrol edin.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@okul.edu.tr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full">
            <Link href="/auth/login" className="flex items-center justify-center text-blue-600 hover:text-blue-500 font-medium">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Giriş sayfasına dön
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
