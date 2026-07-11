"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabase, SUPABASE_ENABLED } from "./supabaseClient";
import { SEED_GAMES, SEED_INVENTORY } from "./seed";
import { uid, nowISO } from "./utils";
import {
  DB, Client, Game, InventoryItem, Allocation, ProgramItem, Offer,
  ChecklistData, ProfileData,
} from "./types";

const LS_KEY = "emzee_db_v1";

function emptyDB(): DB {
  return {
    clients: [], games: [], inventory: [], allocations: [],
    program_items: [], offers: [], checklists: {}, profiles: {},
  };
}

function seededDB(): DB {
  const db = emptyDB();
  db.games = SEED_GAMES.map((g) => ({ ...g, id: uid() }));
  db.inventory = SEED_INVENTORY.map((i) => ({ ...i, id: uid() }));
  return db;
}

interface StoreValue {
  ready: boolean;
  mode: "local" | "cloud";
  authed: boolean;
  userEmail: string | null;
  db: DB;
  // auth
  signIn: (email: string, pw: string) => Promise<string | null>;
  signUp: (email: string, pw: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  // clients
  saveClient: (c: Partial<Client> & { id?: string }) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  // games
  saveGame: (g: Partial<Game> & { id?: string }) => Promise<Game>;
  deleteGame: (id: string) => Promise<void>;
  // inventory
  saveInventory: (i: Partial<InventoryItem> & { id?: string }) => Promise<InventoryItem>;
  deleteInventory: (id: string) => Promise<void>;
  // allocations
  setAllocations: (clientId: string, allocs: { inventory_id: string; qty: number }[]) => Promise<void>;
  // program
  saveProgram: (clientId: string, items: ProgramItem[]) => Promise<void>;
  // offers
  saveOffer: (o: Partial<Offer> & { id?: string }) => Promise<Offer>;
  deleteOffer: (id: string) => Promise<void>;
  // forms
  saveChecklist: (clientId: string, data: ChecklistData) => Promise<void>;
  saveProfile: (clientId: string, data: ProfileData) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const mode: "local" | "cloud" = SUPABASE_ENABLED ? "cloud" : "local";
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(mode === "local");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [db, setDb] = useState<DB>(emptyDB());

  const persistLocal = useCallback((next: DB) => {
    if (mode === "local") {
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
    }
  }, [mode]);

  const mutate = useCallback((fn: (d: DB) => DB) => {
    setDb((prev) => {
      const next = fn(structuredCloneSafe(prev));
      persistLocal(next);
      return next;
    });
  }, [persistLocal]);

  // ---------- LOAD ----------
  const loadLocal = useCallback(() => {
    let data: DB;
    try {
      const raw = localStorage.getItem(LS_KEY);
      data = raw ? JSON.parse(raw) : seededDB();
    } catch {
      data = seededDB();
    }
    if (!data.games || data.games.length === 0) data = { ...seededDB(), ...data, games: seededDB().games };
    // ensure containers
    data.checklists = data.checklists || {};
    data.profiles = data.profiles || {};
    data.allocations = data.allocations || [];
    data.program_items = data.program_items || [];
    data.offers = data.offers || [];
    setDb(data);
    persistLocal(data);
  }, [persistLocal]);

  const loadCloud = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const [clients, games, inventory, allocations, program_items, offers, checklists, profiles] =
      await Promise.all([
        sb.from("clients").select("*").order("event_date", { ascending: true }),
        sb.from("games").select("*").order("name"),
        sb.from("inventory").select("*").order("name"),
        sb.from("allocations").select("*"),
        sb.from("program_items").select("*").order("position"),
        sb.from("offers").select("*"),
        sb.from("checklists").select("*"),
        sb.from("couple_profiles").select("*"),
      ]);
    const clMap: Record<string, ChecklistData> = {};
    (checklists.data || []).forEach((r: any) => { clMap[r.client_id] = r.data || {}; });
    const prMap: Record<string, ProfileData> = {};
    (profiles.data || []).forEach((r: any) => { prMap[r.client_id] = r.data || {}; });
    setDb({
      clients: (clients.data || []) as Client[],
      games: (games.data || []) as Game[],
      inventory: (inventory.data || []) as InventoryItem[],
      allocations: (allocations.data || []) as Allocation[],
      program_items: (program_items.data || []) as ProgramItem[],
      offers: ((offers.data || []) as any[]).map((o) => ({ ...o, items: o.items || [] })) as Offer[],
      checklists: clMap,
      profiles: prMap,
    });
  }, []);

  const reload = useCallback(async () => {
    if (mode === "cloud") await loadCloud();
    else loadLocal();
  }, [mode, loadCloud, loadLocal]);

  useEffect(() => {
    if (mode === "local") {
      loadLocal();
      setReady(true);
      return;
    }
    const sb = getSupabase();
    if (!sb) { setReady(true); return; }

    // Plasă de siguranță: aplicația nu trebuie să rămână NICIODATĂ pe spinner.
    const failsafe = setTimeout(() => setReady(true), 2500);

    const { data: sub } = sb.auth.onAuthStateChange(async (_e, session) => {
      setAuthed(Boolean(session));
      setUserEmail(session?.user.email ?? null);
      if (session) { try { await loadCloud(); } catch {} }
      else setDb(emptyDB());
      clearTimeout(failsafe);
      setReady(true);
    });

    (async () => {
      try {
        const result = await Promise.race([
          sb.auth.getSession(),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500)),
        ]);
        const session = result.data.session;
        if (session) {
          setAuthed(true);
          setUserEmail(session.user.email ?? null);
          try { await loadCloud(); } catch {}
        }
      } catch { /* getSession blocat/timeout — continuăm oricum */ }
      clearTimeout(failsafe);
      setReady(true);
    })();

    return () => { clearTimeout(failsafe); sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---------- AUTH ----------
  const signIn = useCallback(async (email: string, pw: string) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, pw: string) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { error } = await sb.auth.signUp({ email, password: pw });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setAuthed(false);
    setUserEmail(null);
  }, []);

  // ---------- helpers ----------
  const sb = () => getSupabase();

  // ---------- CLIENTS ----------
  const saveClient = useCallback(async (c: Partial<Client> & { id?: string }) => {
    const base: Client = {
      id: c.id || uid(), couple: c.couple || "Miri noi", family: c.family || "",
      event_date: c.event_date || "", city: c.city || "", venue: c.venue || "",
      fee: c.fee ?? null, currency: c.currency || "RON", status: c.status || "lead",
      svc_mc: c.svc_mc ?? true, svc_program: c.svc_program ?? false, svc_games: c.svc_games ?? false,
      svc_flowers: c.svc_flowers ?? false, svc_kids: c.svc_kids ?? false, svc_rentals: c.svc_rentals ?? false,
      svc_corporate: c.svc_corporate ?? false, guests: c.guests ?? null, notes: c.notes || "",
      program_start: c.program_start || "16:00", created_at: c.created_at || nowISO(),
    };
    if (mode === "cloud") {
      const client = sb()!;
      // pregătim rândul pentru DB: fără id/created_at, data goală -> null (coloană de tip date)
      const { id: _id, created_at: _ca, ...rest } = base as any;
      const dbRow = { ...rest, event_date: base.event_date || null };
      if (c.id) {
        const { error } = await client.from("clients").update(dbRow).eq("id", c.id);
        if (error) { console.error("Eroare la salvarea clientului:", error); throw new Error(error.message); }
        mutate((d) => { d.clients = d.clients.map((x) => x.id === c.id ? base : x); return d; });
      } else {
        const { data, error } = await client.from("clients").insert(dbRow).select().single();
        if (error) { console.error("Eroare la crearea clientului:", error); throw new Error(error.message); }
        const saved = (data || base) as Client;
        mutate((d) => { d.clients = [...d.clients, saved]; return d; });
        return saved;
      }
    } else {
      mutate((d) => {
        if (c.id && d.clients.some((x) => x.id === c.id)) d.clients = d.clients.map((x) => x.id === c.id ? base : x);
        else d.clients = [...d.clients, base];
        return d;
      });
    }
    return base;
  }, [mode, mutate]);

  const deleteClient = useCallback(async (id: string) => {
    if (mode === "cloud") await sb()!.from("clients").delete().eq("id", id);
    mutate((d) => {
      d.clients = d.clients.filter((x) => x.id !== id);
      d.allocations = d.allocations.filter((a) => a.client_id !== id);
      d.program_items = d.program_items.filter((p) => p.client_id !== id);
      delete d.checklists[id]; delete d.profiles[id];
      return d;
    });
  }, [mode, mutate]);

  // ---------- GAMES ----------
  const saveGame = useCallback(async (g: Partial<Game> & { id?: string }) => {
    const base: Game = { id: g.id || uid(), name: g.name || "Joc nou", category: g.category || "Necategorisit", instructions: g.instructions || "", favorite: g.favorite ?? false };
    if (mode === "cloud") {
      const client = sb()!;
      const { id, ...rest } = base as any;
      if (g.id) { await client.from("games").update(rest).eq("id", g.id); mutate((d) => { d.games = d.games.map((x) => x.id === g.id ? base : x); return d; }); }
      else { const { data } = await client.from("games").insert(rest).select().single(); const saved = (data || base) as Game; mutate((d) => { d.games = [...d.games, saved]; return d; }); return saved; }
    } else {
      mutate((d) => { if (g.id && d.games.some((x) => x.id === g.id)) d.games = d.games.map((x) => x.id === g.id ? base : x); else d.games = [...d.games, base]; return d; });
    }
    return base;
  }, [mode, mutate]);

  const deleteGame = useCallback(async (id: string) => {
    if (mode === "cloud") await sb()!.from("games").delete().eq("id", id);
    mutate((d) => { d.games = d.games.filter((x) => x.id !== id); return d; });
  }, [mode, mutate]);

  // ---------- INVENTORY ----------
  const saveInventory = useCallback(async (i: Partial<InventoryItem> & { id?: string }) => {
    const base: InventoryItem = { id: i.id || uid(), name: i.name || "Articol nou", qty: i.qty ?? 1, notes: i.notes || "" };
    if (mode === "cloud") {
      const client = sb()!;
      const { id, ...rest } = base as any;
      if (i.id) { await client.from("inventory").update(rest).eq("id", i.id); mutate((d) => { d.inventory = d.inventory.map((x) => x.id === i.id ? base : x); return d; }); }
      else { const { data } = await client.from("inventory").insert(rest).select().single(); const saved = (data || base) as InventoryItem; mutate((d) => { d.inventory = [...d.inventory, saved]; return d; }); return saved; }
    } else {
      mutate((d) => { if (i.id && d.inventory.some((x) => x.id === i.id)) d.inventory = d.inventory.map((x) => x.id === i.id ? base : x); else d.inventory = [...d.inventory, base]; return d; });
    }
    return base;
  }, [mode, mutate]);

  const deleteInventory = useCallback(async (id: string) => {
    if (mode === "cloud") await sb()!.from("inventory").delete().eq("id", id);
    mutate((d) => { d.inventory = d.inventory.filter((x) => x.id !== id); d.allocations = d.allocations.filter((a) => a.inventory_id !== id); return d; });
  }, [mode, mutate]);

  // ---------- ALLOCATIONS ----------
  const setAllocations = useCallback(async (clientId: string, allocs: { inventory_id: string; qty: number }[]) => {
    const rows: Allocation[] = allocs.filter((a) => a.qty > 0).map((a) => ({ id: uid(), client_id: clientId, inventory_id: a.inventory_id, qty: a.qty }));
    if (mode === "cloud") {
      const client = sb()!;
      await client.from("allocations").delete().eq("client_id", clientId);
      if (rows.length) {
        const insertRows = rows.map(({ id, ...r }) => r);
        const { data } = await client.from("allocations").insert(insertRows).select();
        const saved = (data || rows) as Allocation[];
        mutate((d) => { d.allocations = [...d.allocations.filter((a) => a.client_id !== clientId), ...saved]; return d; });
        return;
      }
    }
    mutate((d) => { d.allocations = [...d.allocations.filter((a) => a.client_id !== clientId), ...rows]; return d; });
  }, [mode, mutate]);

  // ---------- PROGRAM ----------
  const saveProgram = useCallback(async (clientId: string, items: ProgramItem[]) => {
    const normalized = items.map((it, i) => ({ ...it, id: it.id || uid(), client_id: clientId, position: i }));
    if (mode === "cloud") {
      const client = sb()!;
      await client.from("program_items").delete().eq("client_id", clientId);
      if (normalized.length) {
        const insertRows = normalized.map(({ id, ...r }) => r);
        const { data } = await client.from("program_items").insert(insertRows).select().order("position");
        const saved = (data || normalized) as ProgramItem[];
        mutate((d) => { d.program_items = [...d.program_items.filter((p) => p.client_id !== clientId), ...saved]; return d; });
        return;
      }
    }
    mutate((d) => { d.program_items = [...d.program_items.filter((p) => p.client_id !== clientId), ...normalized]; return d; });
  }, [mode, mutate]);

  // ---------- OFFERS ----------
  const saveOffer = useCallback(async (o: Partial<Offer> & { id?: string }) => {
    const base: Offer = {
      id: o.id || uid(), client_id: o.client_id ?? null, couple: o.couple || "", event_date: o.event_date || "",
      venue: o.venue || "", guests: o.guests ?? null, currency: o.currency || "RON", discount: o.discount ?? 0,
      notes: o.notes || "", terms: o.terms || "", items: o.items || [], created_at: o.created_at || nowISO(),
    };
    if (mode === "cloud") {
      const client = sb()!;
      const { id: _id, created_at: _ca, ...rest } = base as any;
      const dbRow = { ...rest, event_date: base.event_date || null };
      if (o.id && db.offers.some((x) => x.id === o.id)) {
        const { error } = await client.from("offers").update(dbRow).eq("id", o.id);
        if (error) { console.error("Eroare la salvarea ofertei:", error); throw new Error(error.message); }
        mutate((d) => { d.offers = d.offers.map((x) => x.id === o.id ? base : x); return d; });
      } else {
        const { data, error } = await client.from("offers").insert(dbRow).select().single();
        if (error) { console.error("Eroare la crearea ofertei:", error); throw new Error(error.message); }
        const saved = (data || base) as Offer; mutate((d) => { d.offers = [...d.offers, saved]; return d; }); return saved;
      }
    } else {
      mutate((d) => { if (o.id && d.offers.some((x) => x.id === o.id)) d.offers = d.offers.map((x) => x.id === o.id ? base : x); else d.offers = [...d.offers, base]; return d; });
    }
    return base;
  }, [mode, mutate, db.offers]);

  const deleteOffer = useCallback(async (id: string) => {
    if (mode === "cloud") await sb()!.from("offers").delete().eq("id", id);
    mutate((d) => { d.offers = d.offers.filter((x) => x.id !== id); return d; });
  }, [mode, mutate]);

  // ---------- CHECKLIST / PROFILE ----------
  const saveChecklist = useCallback(async (clientId: string, data: ChecklistData) => {
    if (mode === "cloud") await sb()!.from("checklists").upsert({ client_id: clientId, data, updated_at: nowISO() });
    mutate((d) => { d.checklists = { ...d.checklists, [clientId]: data }; return d; });
  }, [mode, mutate]);

  const saveProfile = useCallback(async (clientId: string, data: ProfileData) => {
    if (mode === "cloud") await sb()!.from("couple_profiles").upsert({ client_id: clientId, data, updated_at: nowISO() });
    mutate((d) => { d.profiles = { ...d.profiles, [clientId]: data }; return d; });
  }, [mode, mutate]);

  const value: StoreValue = {
    ready, mode, authed, userEmail, db,
    signIn, signUp, signOut,
    saveClient, deleteClient, saveGame, deleteGame, saveInventory, deleteInventory,
    setAllocations, saveProgram, saveOffer, deleteOffer, saveChecklist, saveProfile, reload,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function structuredCloneSafe(d: DB): DB {
  return {
    clients: [...d.clients], games: [...d.games], inventory: [...d.inventory],
    allocations: [...d.allocations], program_items: [...d.program_items], offers: [...d.offers],
    checklists: { ...d.checklists }, profiles: { ...d.profiles },
  };
}
