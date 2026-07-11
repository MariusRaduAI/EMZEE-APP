# 🚀 Ghid de publicare — EMZEE OS

Aplicația e gata. Acum o punem online, cu bază de date reală, în ~30 de minute.
Ai nevoie de 3 conturi gratuite: **GitHub**, **Supabase**, **Vercel**.

> Aplicația merge deja **local** fără nimic din toate astea (`npm run dev`, datele se salvează în browser). Pașii de mai jos sunt pentru varianta **cloud** — sincronizată pe telefon + laptop, cu URL propriu.

---

## Pasul 0 — Ce ai pe calculator

Ai nevoie de **Node.js** (deja instalat dacă ai rulat aplicația) și de **Git**.
Verifică în Terminal:

```bash
node --version   # trebuie să afișeze v18 sau mai mare
git --version
```

---

## Pasul 1 — Cont GitHub + urcă codul

1. Fă cont pe **https://github.com** (dacă nu ai).
2. Instalează GitHub CLI (cel mai simplu mod): https://cli.github.com — sau creează repo manual din interfața web.
3. În Terminal, intră în folderul aplicației și urcă codul:

```bash
cd "/Users/marius/Downloads/emzee-app"

# creează repo PRIVAT pe contul tău și urcă tot (varianta cu GitHub CLI)
gh auth login
gh repo create emzee-app --private --source=. --remote=origin --push
```

> **Fără GitHub CLI?** Creează manual un repo gol (privat) pe github.com, apoi:
> ```bash
> git remote add origin https://github.com/UTILIZATORUL-TAU/emzee-app.git
> git push -u origin main
> ```

✅ Datele reale ale clienților **NU** ajung pe GitHub (sunt în `.gitignore`). Repo-ul e și **privat**.

---

## Pasul 2 — Bază de date Supabase

1. Fă cont pe **https://supabase.com** → **New project**.
   - Alege un nume (ex. `emzee`), o parolă pentru baza de date (salveaz-o) și regiunea **Frankfurt (eu-central)** — cea mai apropiată.
2. Așteaptă ~2 minute să se creeze proiectul.
3. În stânga, deschide **SQL Editor** → **New query**.
4. Deschide fișierul `supabase/schema.sql` din folderul aplicației, **copiază tot**, lipește în editor și apasă **Run**. (creează tabelele)
5. New query din nou → copiază tot din `supabase/seed.sql` → **Run**. (adaugă cele 73 de jocuri + inventarul)
6. **Cheile API:** mergi la **Project Settings → API** și copiază:
   - **Project URL** (ex. `https://xxxx.supabase.co`)
   - **anon public** key (un șir lung)

---

## Pasul 3 — Deploy pe Vercel

1. Fă cont pe **https://vercel.com** cu contul de **GitHub** (butonul „Continue with GitHub").
2. **Add New → Project** → alege repo-ul `emzee-app` → **Import**.
3. La secțiunea **Environment Variables**, adaugă cele două chei de la Supabase:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | *Project URL de la Supabase* |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *anon public key* |

4. Apasă **Deploy**. După ~1 minut ai un link de forma `https://emzee-app.vercel.app` 🎉

---

## Pasul 4 — Creează-ți contul în aplicație

1. Deschide link-ul de la Vercel.
2. Apasă **Creează cont** și înregistrează-te cu emailul tău (ex. `office@wle.ro`) + o parolă.
   - Dacă Supabase cere confirmare pe email: **Supabase → Authentication → Providers → Email** și dezactivează „Confirm email" ca să te loghezi direct (pentru uz personal e ok).
3. Gata — ești în aplicație, cu baza de date cloud.

---

## Pasul 5 (opțional) — Importă cei 43 de clienți reali din Excel

Datele tale reale sunt pregătite local, dar **nu** au fost urcate pe GitHub (confidențialitate).

1. Deschide `supabase/seed_clients.local.sql` din folderul aplicației.
2. Copiază tot conținutul.
3. Supabase → **SQL Editor** → New query → lipește → **Run**.

✅ Cei 43 de clienți apar imediat în aplicație, pe calendar și în listă.
(Ai și un backup în `emzee-clients-backup.json`.)

---

## Cum fac modificări mai târziu?

Orice schimbare în cod:

```bash
cd "/Users/marius/Downloads/emzee-app"
git add -A
git commit -m "descrierea schimbării"
git push
```

Vercel redeployează **automat** în ~1 minut. Nu trebuie să faci nimic manual.

---

## Probleme frecvente

- **„Se încarcă…" la nesfârșit / ecran de login gol** → cheile Supabase lipsesc sau sunt greșite în Vercel. Verifică Environment Variables și redeploy.
- **Nu văd jocurile** → ai rulat `seed.sql`? (Pasul 2.5)
- **Nu mă pot loga** → dezactivează „Confirm email" în Supabase (Pasul 4.2).
- **Vreau să lucrez local cu datele cloud** → creează un fișier `.env.local` (copie după `.env.local.example`) cu aceleași 2 chei, apoi `npm run dev`.

Orice blocaj — spune-mi exact la ce pas ești și te ajut.
