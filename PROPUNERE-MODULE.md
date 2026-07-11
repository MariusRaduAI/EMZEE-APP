# EMZEE OS — Propunere: platformă modulară (mini-ERP) pentru furnizorii de servicii evenimente

## Conceptul

Un singur produs, dar la onboarding utilizatorul bifează ce face: MC, flori, sunet/lumini, band/DJ, photobooth, foto-video, decor/rentals, planner, catering, kids entertainment etc. În funcție de selecție se activează modulele relevante. Sidebar-ul arată doar ce folosește — fără balast. Poate activa/dezactiva module oricând din setări.

**Promisiunea produsului:** „Tot business-ul tău de evenimente într-un singur loc, la un preț corect."

---

## 1. Module CORE (toată lumea le primește)

| Modul | Ce face | Observații |
|---|---|---|
| **Dashboard** | Următorul eveniment, venituri, evenimente luna asta, acțiuni rapide | Widget-urile se adaptează la modulele active |
| **Calendar & Bookings** | Toate evenimentele, status (cerere → rezervat → confirmat → livrat), detectare conflicte de dată | Vitală: alertă când primești 2 cereri pe aceeași dată |
| **CRM Clienți** | Fișă client cu tab-uri; tab-urile depind de modulele active | Deja există — devine „shell"-ul în care se montează modulele |
| **Pipeline lead-uri** | Cereri noi → ofertat → negociere → câștigat/pierdut, cu motiv pierdere | Simplu, kanban. Îți spune și rata de conversie |
| **Oferte & Contracte** | Generator ofertă cu pachetele TALE, discount, export PDF, contract generat din ofertă | Există deja — se parametrizează pe verticală (template-uri de pachete per tip serviciu) |
| **Financiar** | Avans/rest de plată per eveniment, scadențe, cheltuieli per eveniment, profit real | Cel mai cerut lucru la firmele mici: „cât am câștigat de fapt pe nunta X?" |
| **Inventar** | Stoc, alocare pe evenimente, disponibilitate pe dată | Merge la toți: florărie (vaze), sunet (boxe), photobooth (props), band (backline) |
| **Checklist** | Șabloane de checklist **per verticală** + șabloane proprii | Nu un checklist universal, ci: „checklist florist", „checklist MC", „checklist tehnic sunet" |
| **To-Do & Echipă** | Task-uri per eveniment, asignare pe oameni | Există deja |
| **Rapoarte** | Venit pe lună/serviciu/tip eveniment, sezon, top clienți | Există deja |

---

## 2. Module pe verticală (selectabile)

### 🎤 MC / Entertainment
- Banca de jocuri (există, 73+) — cu istoricul „ce jocuri am folosit la clientul X" ca să nu repeți la aceleași cercuri de invitați
- Generator program / timeline (există)
- Profil miri & invitați (există)
- Fișă de moment: intro-uri, dansuri, momente speciale, pronunție nume

### 💐 Flori / Decor floral
- **Rețete florale (BOM):** buchet mireasă = 15 trandafiri + 5 eucalipt + …; recalculezi automat necesarul pentru tot evenimentul
- Calculator cost + markup → preț final per aranjament
- **Comenzi furnizori:** agregare necesar pe săptămână din toate evenimentele → o singură comandă la en-gros
- Galerie foto per aranjament (portofoliu + „așa a arătat la clientul X")
- Perisabilitate: ce cumperi cu 2 zile înainte vs. cu o săptămână

### 🔊 Sunet & Lumini
- **Fișă tehnică per eveniment:** ce echipamente merg, schema de amplasare, necesar curent
- Packing list generată automat din fișa tehnică (bifezi la încărcare și la retur — nimic uitat în sală)
- Program montaj/demontaj cu ore și oameni alocați
- **Mentenanță echipamente:** istoric defecte, service, „boxa X e la reparat până pe 20"
- Rider tehnic PDF pe care îl trimiți locației/formației

### 🎸 Band / DJ
- **Repertoriu & Setlist builder:** drag & drop pe momente (cocktail, dans 1, party)
- Formular public pentru client: must-play / don't-play / dedicații
- Membri & cachete: cine cântă la ce eveniment, cât ia fiecare, ce rămâne firmei
- Repetiții în calendar, rider tehnic propriu

### 📸 Photobooth
- Template-uri de print per eveniment (asociezi design-ul aprobat de client)
- Inventar props + consumabile cu alertă stoc (hârtie, cerneală — se termină mereu la mijlocul evenimentului)
- Contor printuri per eveniment → cost real per eveniment
- Link galerie digitală per eveniment de trimis clientului

### 📷 Foto / Video
- **Shot list** per eveniment (momentele obligatorii cerute de client)
- Pipeline livrare: shooting → selecție → editare → livrat, cu termene și alerte
- Acord GDPR / drepturi de imagine în contract
- Link-uri galerii livrate, per client

### 🪑 Decor & Rentals
- Alocare stoc pe date + verificare disponibilitate (există)
- **Damage tracking:** poze la predare/retur, garanții, rețineri
- Fișă logistică: transport, cine încarcă, adresa, ora de acces în locație

### 🍰 Catering / Candy bar
- Meniuri & alergeni
- Cost per porție → necesar cantități calculat automat din numărul de invitați
- Necesar aprovizionare agregat pe săptămână

### 📋 Wedding / Event Planner
- Buget client cu categorii și plăți urmărite
- **Vendor management:** furnizorii evenimentului, contracte, scadențe, contacte
- Seating chart + RSVP (formular public pentru invitați)
- Timeline master al zilei, partajabil cu toți furnizorii

### 🎈 Kids entertainment
- Program activități pe vârste
- Animatori: cine, unde, costume/materiale necesare
- Checklist materiale per tip de petrecere

### 🏢 Corporate (există schița)
- Pachete team-building, oferte B2B, facturare pe firmă, PO-uri

---

## 3. Funcții transversale care vând produsul (idei suplimentare)

1. **Portal client** — link unic per eveniment unde clientul vede oferta, contractul, programul, plățile și poate completa formularele (profil miri, must-play, RSVP). Reduce enorm din telefoane și mesaje. *Probabil feature-ul cu cel mai mare impact.*
2. **eFactura / SmartBill / Oblio integrare** — în România e obligatoriu; dacă rezolvi facturarea, ai un argument de vânzare decisiv.
3. **Semnare contract online** — clientul semnează de pe telefon, gata cu PDF-uri printate.
4. **Plăți online avans** — link de plată în ofertă (Stripe/Netopia); avansul încasat = data blocată automat în calendar.
5. **Mesaje automate** — reminder plată rest, „mai sunt 30 zile, hai să finalizăm programul", follow-up după eveniment + cerere recenzie Google.
6. **Mod „Ziua Evenimentului"** — ecran mobil (PWA, offline) cu timeline-ul, contactele, checklist-ul și packing list-ul zilei. Pe teren nu ai laptop și uneori nici semnal.
7. **Multi-user & roluri** — patronul vede banii, angajatul vede doar task-urile și programul.
8. **Detectare suprapuneri resurse** — nu doar date duble, ci: „boxa X e alocată la 2 evenimente pe 15 august".
9. **Șabloane de eveniment** — „nuntă standard" duplică tot setup-ul: checklist, program schelet, ofertă tip.
10. **Statistici de business** — sezon, tip eveniment cel mai profitabil, rată conversie oferte, valoare medie contract.
11. **Director de colaboratori** *(fază 2)* — MC-ul recomandă floristul din platformă; efect de rețea între utilizatori, plus potențial comision.
12. **Website widget** — formular „cere ofertă" de pus pe site-ul lor, care intră direct în pipeline.

---

## 4. Cine e clientul (nu doar nunți)

Aceeași structură acoperă: botezuri, majorate, corporate & team-building, conferințe mici, petreceri private, târguri/activări de brand, evenimente școlare. Modulele sunt aceleași — doar șabloanele diferă. Deci piața reală e „orice PFA/SRL mic care prestează servicii la evenimente", nu doar industria nunților.

---

## 5. Monetizare (orientativ)

- **Free / Solo:** 1 utilizator, 5 evenimente active, module core — poarta de intrare
- **Pro (~49–79 lei/lună):** evenimente nelimitate, toate modulele verticalei alese, portal client, exporturi
- **Team (~129–199 lei/lună):** multi-user, roluri, toate verticalele, integrare facturare
- Alternativă: preț de bază mic + module ca add-on (9–19 lei/modul/lună) — flexibil, dar mai greu de comunicat; recomand tiers simple

---

## 6. Cum se implementează modular (pe scurt, pe codul existent)

- Tabel `account_modules` în Supabase (sau câmp `modules: string[]` pe profil) + feature flags
- **Onboarding wizard:** „Ce servicii oferi?" → bifezi → se activează modulele + se încarcă șabloanele de checklist/pachete ale verticalei
- Sidebar-ul (deja componentă) se randează din lista de module active
- Tab-urile din fișa clientului se montează dinamic după module
- Checklist-ul devine motor de șabloane: `checklist_templates` per verticală + custom
- Paginile existente (jocuri, program, flori, inventar) devin primele module — arhitectura actuală se pretează, nu e rescriere

---

## 7. Roadmap propus

- **Faza 1:** modularizare (onboarding + feature flags + sidebar dinamic), checklist pe șabloane, financiar per eveniment
- **Faza 2:** portal client + semnare online + module noi: sunet, band, photobooth
- **Faza 3:** plăți online, facturare eFactura, mesaje automate, mod „ziua evenimentului"
- **Faza 4:** multi-user, foto/video, planner complet (seating, RSVP), director colaboratori
