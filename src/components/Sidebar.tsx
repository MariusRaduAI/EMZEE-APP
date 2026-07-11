"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/utils";

const NAV: { href: string; label: string; icon: (p: { className?: string }) => React.ReactNode; badge?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Icon.dashboard },
  { href: "/calendar", label: "Calendar", icon: Icon.calendar },
  { href: "/todo", label: "To Do", icon: Icon.agenda },
  { href: "/clients", label: "Clienți", icon: Icon.users },
  { href: "/reports", label: "Rapoarte", icon: Icon.chart },
  { href: "/games", label: "Banca de jocuri", icon: Icon.games },
  { href: "/program", label: "Generator program", icon: Icon.clock },
  { href: "/checklist", label: "Checklist planner", icon: Icon.check },
  { href: "/profile", label: "Profil miri & invitați", icon: Icon.rings },
  { href: "/flori", label: "Brief Flori", icon: Icon.flower },
  { href: "/offers", label: "Generator oferte", icon: Icon.offer },
  { href: "/inventory", label: "Inventar & Rentals", icon: Icon.box },
  { href: "/followup", label: "Follow-up & Recenzii", icon: Icon.send },
  { href: "/corporate", label: "Corporate", icon: Icon.building },
];

export function Sidebar() {
  const pathname = usePathname();
  const { mode, userEmail, signOut } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-panel/90 backdrop-blur border-b border-line no-print">
        <Brand />
        <button className="btn-ghost !p-2" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden no-print" onClick={() => setOpen(false)} />}

      <aside className={cx(
        "no-print fixed lg:sticky top-0 z-50 lg:z-10 h-dvh w-[264px] shrink-0 bg-panel border-r border-line flex flex-col transition-transform",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-5 h-16 flex items-center justify-between border-b border-line">
          <Brand />
          <button className="lg:hidden btn-ghost !p-1.5" onClick={() => setOpen(false)}><Icon.close /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cx("navlink", active && "navlink-active")}>
                <n.icon className={cx("w-[18px] h-[18px] shrink-0", active ? "text-brand-soft" : "text-faint")} />
                <span className="flex-1">{n.label}</span>
                {n.badge && <span className="text-[12px] px-1.5 py-0.5 rounded bg-amber/15 text-amber font-semibold">{n.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-line space-y-2">
          <div className="flex items-center gap-2 px-2">
            <span className={cx("w-2 h-2 rounded-full", mode === "cloud" ? "bg-green" : "bg-amber")} />
            <span className="text-xs text-muted">{mode === "cloud" ? "Cloud (Supabase)" : "Local (acest browser)"}</span>
          </div>
          {userEmail && (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-panel2 border border-line">
              <span className="text-xs text-muted truncate">{userEmail}</span>
              <button className="btn-ghost !p-1.5 shrink-0" title="Deconectare" onClick={signOut}><Icon.logout /></button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center">
      <Logo mark className="h-7" />
    </Link>
  );
}
