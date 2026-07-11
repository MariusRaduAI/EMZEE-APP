"use client";

import { Sidebar } from "@/components/Sidebar";
import { useStore } from "@/lib/store";
import { LoginScreen } from "@/components/LoginScreen";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, authed, mode } = useStore();

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <span className="w-4 h-4 rounded-full border-2 border-line border-t-brand animate-spin" />
          Se încarcă…
        </div>
      </div>
    );
  }

  if (mode === "cloud" && !authed) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
