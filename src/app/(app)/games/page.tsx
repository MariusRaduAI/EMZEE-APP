"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm, StatusBadge } from "@/components/ui";
import { Game } from "@/lib/types";
import { cx } from "@/lib/utils";

export default function GamesPage() {
  const { db, saveGame, deleteGame } = useStore();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [detail, setDetail] = useState<Game | null>(null);
  const [editing, setEditing] = useState<Game | null>(null);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    db.games.forEach((g) => m.set(g.category || "Necategorisit", (m.get(g.category || "Necategorisit") || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [db.games]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return db.games
      .filter((g) => (!cat || g.category === cat) && (!onlyFav || g.favorite) &&
        (!ql || g.name.toLowerCase().includes(ql) || g.instructions.toLowerCase().includes(ql) || g.category.toLowerCase().includes(ql)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.games, q, cat, onlyFav]);

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="Banca de jocuri" subtitle={`${db.games.length} jocuri · clic pe un joc pentru instrucțiuni`} icon={<Icon.games />}>
        <button className="btn-brand" onClick={() => setEditing({ id: "", name: "", category: "Necategorisit", instructions: "", favorite: false })}><Icon.plus /> Joc nou</button>
      </PageHeader>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint w-4 h-4" />
            <input className="input pl-9" placeholder="Caută joc, categorie, instrucțiuni…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className={cx("btn", onlyFav && "!border-brand/50 !text-brand-soft")} onClick={() => setOnlyFav((v) => !v)}>
            <Icon.heart className={cx("w-4 h-4", onlyFav && "fill-brand-soft")} /> Favorite
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={cx("chip", !cat ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")} onClick={() => setCat("")}>
            Toate <span className="text-faint">{db.games.length}</span>
          </button>
          {categories.map(([c, n]) => (
            <button key={c} className={cx("chip", cat === c ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")} onClick={() => setCat(cat === c ? "" : c)}>
              {c} <span className="text-faint">{n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th w-10"></th>
                <th className="th">Nume joc</th>
                <th className="th">Categorie</th>
                <th className="th w-24 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-panel2/60 transition-colors cursor-pointer group" onClick={() => setDetail(g)}>
                  <td className="td">
                    <button onClick={(e) => { e.stopPropagation(); saveGame({ ...g, favorite: !g.favorite }); }} className={cx("transition-colors", g.favorite ? "text-brand-soft" : "text-faint hover:text-muted")}>
                      <Icon.heart className={cx("w-[18px] h-[18px]", g.favorite && "fill-current")} />
                    </button>
                  </td>
                  <td className="td font-medium text-ink">
                    <span className="group-hover:text-brand-soft transition-colors">{g.name}</span>
                    {g.instructions && <Icon.chevron className="inline w-3.5 h-3.5 ml-1 text-faint" />}
                  </td>
                  <td className="td"><span className="badge bg-panel2 border border-line text-muted">{g.category || "—"}</span></td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !p-1.5" onClick={(e) => { e.stopPropagation(); setEditing(g); }}><Icon.edit /></button>
                      <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Ștergi jocul „${g.name}”?`)) deleteGame(g.id); }}><Icon.trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">Niciun joc găsit.</p>}
      </div>

      {/* Detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge bg-brand/12 border border-brand/25 text-brand-soft">{detail.category || "Necategorisit"}</span>
              {detail.favorite && <span className="badge bg-panel2 border border-line text-brand-soft"><Icon.heart className="w-3 h-3 fill-current" /> Favorit</span>}
            </div>
            <div>
              <p className="section-title mb-2">Instrucțiuni</p>
              {detail.instructions ? (
                <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap card-2 p-4">{detail.instructions}</p>
              ) : (
                <p className="text-sm text-muted card-2 p-4">Nu există instrucțiuni încă. <button className="text-brand-soft" onClick={() => { setEditing(detail); setDetail(null); }}>Adaugă →</button></p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn" onClick={() => { setEditing(detail); setDetail(null); }}><Icon.edit /> Editează</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Editor */}
      {editing && <GameEditor key={editing.id || "new"} game={editing} onClose={() => setEditing(null)} onSave={(g) => { saveGame(g); setEditing(null); }} categories={categories.map((c) => c[0])} />}
    </div>
  );
}

function GameEditor({ game, onClose, onSave, categories }: { game: Game; onClose: () => void; onSave: (g: Game) => void; categories: string[] }) {
  const [g, setG] = useState<Game>(game);
  return (
    <Modal open onClose={onClose} title={g.id ? "Editează joc" : "Joc nou"} wide>
      <div className="space-y-4">
        <div>
          <label className="label">Nume joc</label>
          <input className="input" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="ex. Cupluri celebre" autoFocus />
        </div>
        <div>
          <label className="label">Categorie</label>
          <input className="input" list="game-cats" value={g.category} onChange={(e) => setG({ ...g, category: e.target.value })} placeholder="ex. Ice-breaker" />
          <datalist id="game-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="label">Instrucțiuni</label>
          <textarea className="input min-h-[160px] resize-y" value={g.instructions} onChange={(e) => setG({ ...g, instructions: e.target.value })} placeholder="Cum se joacă, materiale necesare, reguli, punctaj…" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button className={cx("btn", g.favorite && "!text-brand-soft !border-brand/40")} onClick={() => setG({ ...g, favorite: !g.favorite })}>
            <Icon.heart className={cx("w-4 h-4", g.favorite && "fill-current")} /> Favorit
          </button>
          <div className="flex gap-2">
            <button className="btn" onClick={onClose}>Anulează</button>
            <button className="btn-brand" disabled={!g.name.trim()} onClick={() => onSave(g)}>Salvează</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
