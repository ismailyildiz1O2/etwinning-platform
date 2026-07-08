"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [projects, setProjects] = useState<
    { id: string; name: string; status: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(
            data.map((p: { id: string; name: string; status: string }) => ({
              id: p.id,
              name: p.name,
              status: p.status,
            }))
          );
        }
      } catch {
        // silently fail
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
          {/* Sidebar */}
          <AppSidebar
            projects={projects}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
                <AppSidebar
                  projects={projects}
                  isOpen={true}
                  onToggle={() => setMobileSidebarOpen(false)}
                />
              </div>
            </>
          )}

          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
    </div>
  );
}
