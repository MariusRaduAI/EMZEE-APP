"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ClientSelect, EmptyPick } from "@/components/common";
import { ProgramBuilder } from "@/components/ProgramBuilder";
import { Icon } from "@/components/ui";
import { useAutoClient } from "@/lib/useAutoClient";

export default function ProgramPage() {
  const { db } = useStore();
  const auto = useAutoClient();
  const [picked, setPicked] = useState("");
  const clientId = picked || auto;

  return (
    <div className="fade-in">
      <PageHeader title="Generator program" subtitle="Timeline pe intervale, cu culori, drag & drop. Export PDF sau Excel." icon={<Icon.clock />}>
        <ClientSelect value={clientId} onChange={setPicked} />
      </PageHeader>
      {clientId && db.clients.some((c) => c.id === clientId)
        ? <ProgramBuilder key={clientId} clientId={clientId} />
        : <EmptyPick label="Programul se salvează pentru fiecare eveniment. Alege clientul pentru care construiești timeline-ul." />}
    </div>
  );
}
