"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { I18nProvider } from "./i18n-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper.
 *
 * Composes:
 * - SessionProvider (NextAuth session context)
 * - I18nProvider (Dynamic language context)
 * - ThemeProvider (next-themes dark/light mode)
 * - Toaster (sonner toast notifications)
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
