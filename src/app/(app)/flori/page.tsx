"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ClientSelect, EmptyPick } from "@/components/common";
import { FloralForm } from "@/components/FloralForm";
import { Icon } from "@/components/ui";
import { useAutoClient } from "@/lib/useAutoClient";

export default function FloriPage() {
  const { db } = useStore();
  const auto = useAutoClient();
  const [picked, setPicked] = useState("");
  const clientId = picked || auto;

  return (
    <div className="fade-in">
      <PageHeader title="Flori — concept" subtitle="Paletă, stil, flori și elemente pentru aranjamentele florale." icon={<Icon.flower />}>
        <ClientSelect value={clientId} onChange={setPicked} />
      </PageHeader>
      {clientId && db.clients.some((c) => c.id === clientId)
        ? <FloralForm key={clientId} clientId={clientId} />
        : <EmptyPick label="Brief-ul floral se salvează pentru fiecare eveniment. Alege clientul pentru care pregătești florile." />}
    </div>
  );
}
