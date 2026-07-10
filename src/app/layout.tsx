import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eTwin Asistan - eTwinning Proje Yönetimi",
  description:
    "eTwinning projelerinizi kolayca yönetin. AI destekli görev önerileri, takım çalışması ve ilerleme takibi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const locale = (session?.user?.language as Locale) || "en";
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
