# EMZEE OS — Event Management Platform

Platformă internă de management pentru business-ul de evenimente (MC, wedding planner, rentals, flori, corporate). Construită pentru a gestiona tot: clienți, calendar, jocuri, program, oferte, inventar.

## Funcționalități

- **Panou principal** — următorul eveniment, venit, statistici, acțiuni rapide.
- **Calendar** — toate evenimentele luna cu luna, cu servicii și fee.
- **Clienți (CRM)** — centralizare completă; fiecare client are tab-uri: Prezentare, Program, Checklist, Profil miri, Ofertă, Rentals.
- **Banca de jocuri** — 73+ jocuri, filtrare pe categorii, instrucțiuni, favorite, căutare.
- **Generator program** — timeline pe intervale, drag & drop, culori per activitate, ore calculate automat, export PDF + Excel.
- **Checklist planner** — formular complet de planificare eveniment, cu progres și export PDF.
- **Profil miri & invitați** — stil, dinamică, priorități + demografie (vârste, religie, cupluri/singuri, copii, origine, seating).
- **Generator oferte** — pachete gata făcute (MC, flori, rentals, kids), total automat, discount, export PDF + Excel.
- **Inventar & Rentals** — stoc, alocare pe evenimente, verificare disponibilitate pe dată.
- **Corporate** — pachete team-building (în dezvoltare).

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** (temă enterprise dark)
- **Supabase** (Postgres + Auth) — cu fallback automat pe **localStorage** dacă nu sunt setate cheile

## Rulare locală

```bash
npm install
npm run dev       # http://localhost:3000
```

Fără chei Supabase → mod **local** (date în browser). Cu `.env.local` completat → mod **cloud**.

## Publicare (cloud)

Vezi **[DEPLOY.md](./DEPLOY.md)** — ghid pas-cu-pas pentru GitHub + Supabase + Vercel.

## Structură

```
src/
  app/(app)/        paginile aplicației (dashboard, clients, games, ...)
  components/       UI + unelte (ProgramBuilder, OfferBuilder, ChecklistForm, ...)
  lib/              store, tipuri, supabase, seed, utils
supabase/
  schema.sql        tabele + RLS (rulează primul)
  seed.sql          jocuri + inventar
```
