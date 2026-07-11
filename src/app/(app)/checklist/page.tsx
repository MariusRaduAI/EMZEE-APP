"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ClientSelect, EmptyPick } from "@/components/common";
import { ChecklistForm } from "@/components/ChecklistForm";
import { Icon } from "@/components/ui";
import { useAutoClient } from "@/lib/useAutoClient";

export default function ChecklistPage() {
  const { db } = useStore();
  const auto = useAutoClient();
  const [picked, setPicked] = useState("");
  const clientId = picked || auto;

  return (
    <div className="fade-in">
      <PageHeader title="Checklist planner" subtitle="Formular complet de planificare — toate detaliile evenimentului într-un singur loc." icon={<Icon.check />}>
        <ClientSelect value={clientId} onChange={setPicked} />
      </PageHeader>
      {clientId && db.clients.some((c) => c.id === clientId)
        ? <ChecklistForm key={clientId} clientId={clientId} />
        : <EmptyPick label="Checklist-ul se salvează pentru fiecare eveniment. Alege clientul pe care îl planifici." />}
    </div>
  );
}
