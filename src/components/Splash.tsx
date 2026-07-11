"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

// Animație de intrare cu logo — o dată pe sesiune.
export function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("emzee_splash")) return;
      sessionStorage.setItem("emzee_splash", "1");
    } catch { /* no-op */ }
    setShow(true);
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(() => setShow(false), 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-bg no-print splash-bg ${leaving ? "splash-out" : ""}`}>
      <div className="flex flex-col items-center">
        <Logo className="h-20 sm:h-28 w-auto text-ink logo-reveal" />
        <div className="mt-8 h-1 w-40 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-brand splash-bar" />
        </div>
      </div>
    </div>
  );
}
