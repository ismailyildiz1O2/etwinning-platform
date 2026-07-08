export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />

      {/* Floating orbs */}
      <div className="fixed top-1/4 -left-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="fixed top-3/4 left-1/3 w-64 h-64 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      {/* Grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
