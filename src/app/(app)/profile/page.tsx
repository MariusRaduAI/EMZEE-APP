"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ClientSelect, EmptyPick } from "@/components/common";
import { ProfileForm } from "@/components/ProfileForm";
import { Icon } from "@/components/ui";
import { useAutoClient } from "@/lib/useAutoClient";

export default function ProfilePage() {
  const { db } = useStore();
  const auto = useAutoClient();
  const [picked, setPicked] = useState("");
  const clientId = picked || auto;

  return (
    <div className="fade-in">
      <PageHeader title="Profil miri & invitați" subtitle="Cunoaște cuplul și publicul: stil, demografie, structură, seating." icon={<Icon.rings />}>
        <ClientSelect value={clientId} onChange={setPicked} />
      </PageHeader>
      {clientId && db.clients.some((c) => c.id === clientId)
        ? <ProfileForm key={clientId} clientId={clientId} />
        : <EmptyPick label="Profilul se salvează pentru fiecare eveniment. Alege clientul pentru care faci profilul." />}
    </div>
  );
}
