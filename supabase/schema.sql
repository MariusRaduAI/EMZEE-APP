-- ============================================================
-- EMZEE — Schema bază de date (rulează în Supabase: SQL Editor)
-- ============================================================
-- Rulează întâi acest fișier, apoi seed.sql (jocuri + inventar).
-- Clienții reali se importă separat din seed_clients.local.sql.

-- Extensii
create extension if not exists "pgcrypto";

-- ---------- CLIENTS (evenimente / nunți) ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  couple text not null,
  family text default '',
  event_date date,
  city text default '',
  venue text default '',
  fee numeric,
  currency text default 'EUR',
  status text default 'lead',
  svc_mc boolean default true,
  svc_program boolean default false,
  svc_games boolean default false,
  svc_flowers boolean default false,
  svc_kids boolean default false,
  svc_rentals boolean default false,
  svc_corporate boolean default false,
  guests integer,
  deposit numeric,
  paid numeric,
  notes text default '',
  program_start text default '16:00',
  program_starts jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ---------- GAMES (banca de jocuri) ----------
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  instructions text default '',
  materials text default '',
  favorite boolean default false,
  created_at timestamptz default now()
);

-- ---------- INVENTORY (rentals) ----------
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  qty integer default 1,
  notes text default '',
  category text default 'jocuri',
  cost numeric,
  created_at timestamptz default now()
);
-- Migrări:
alter table clients add column if not exists deposit numeric;
alter table clients add column if not exists paid numeric;
alter table inventory add column if not exists category text default 'jocuri';
alter table inventory add column if not exists cost numeric;
alter table games add column if not exists materials text default '';

-- ---------- ALLOCATIONS (rezervări inventar per eveniment) ----------
create table if not exists allocations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  inventory_id uuid references inventory(id) on delete cascade,
  qty integer default 1
);

-- ---------- PROGRAM ITEMS (generator de program) ----------
create table if not exists program_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  position integer default 0,
  duration_min integer default 15,
  activity text default '',
  description text default '',
  color text default '#5b57f0',
  start_time text default '',
  phase text default 'petrecere'
);
-- Migrări dacă tabelul exista deja:
alter table program_items add column if not exists start_time text default '';
alter table program_items add column if not exists phase text default 'petrecere';
alter table clients add column if not exists program_starts jsonb default '{}'::jsonb;

-- ---------- OFFERS (generator oferte) ----------
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  couple text default '',
  event_date date,
  venue text default '',
  guests integer,
  currency text default 'EUR',
  discount numeric default 0,
  notes text default '',
  terms text default '',
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ---------- TASKS (întâlniri & to-do) ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  kind text default 'todo',
  title text default '',
  client_id uuid references clients(id) on delete set null,
  meeting_type text default '',
  date date,
  time text default '',
  done boolean default false,
  notes text default '',
  created_at timestamptz default now()
);

-- ---------- CORPORATE LEADS ----------
create table if not exists corporate_leads (
  id uuid primary key default gen_random_uuid(),
  company text default '',
  contact text default '',
  email text default '',
  phone text default '',
  date date,
  status text default 'lead',
  participants integer,
  format jsonb default '[]'::jsonb,
  objectives jsonb default '[]'::jsonb,
  activities jsonb default '[]'::jsonb,
  location text default '',
  catering text default '',
  budget numeric,
  deadline date,
  notes text default '',
  created_at timestamptz default now()
);

-- ---------- CHECKLISTS (planner) ----------
create table if not exists checklists (
  client_id uuid primary key references clients(id) on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- COUPLE PROFILES (profil miri + invitați) ----------
create table if not exists couple_profiles (
  client_id uuid primary key references clients(id) on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- FLORAL BRIEFS ----------
create table if not exists floral_briefs (
  client_id uuid primary key references clients(id) on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- CONTRACTS ----------
create table if not exists contracts (
  client_id uuid primary key references clients(id) on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- ============================================================
-- Row Level Security — aplicație single-user (doar utilizatori logați)
-- ============================================================
alter table clients enable row level security;
alter table games enable row level security;
alter table inventory enable row level security;
alter table allocations enable row level security;
alter table program_items enable row level security;
alter table offers enable row level security;
alter table tasks enable row level security;
alter table corporate_leads enable row level security;
alter table checklists enable row level security;
alter table couple_profiles enable row level security;
alter table floral_briefs enable row level security;
alter table contracts enable row level security;

-- Politici: orice utilizator AUTENTIFICAT are acces complet.
do $$
declare t text;
begin
  foreach t in array array['clients','games','inventory','allocations','program_items','offers','tasks','corporate_leads','checklists','couple_profiles','floral_briefs','contracts']
  loop
    execute format('drop policy if exists "auth_all" on %I;', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Index utile
create index if not exists idx_clients_date on clients(event_date);
create index if not exists idx_program_client on program_items(client_id);
create index if not exists idx_alloc_client on allocations(client_id);
