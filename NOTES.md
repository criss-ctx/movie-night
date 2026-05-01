# Movie Night — Notes de session

## Session du 29 avril 2026

- Serveur Express + journal.json (remplacé depuis)
- Redesign mobile-first : fond ardoise, Cormorant Garamond, accent or, néon sur slide tirage
- Fonctionnalités journal : ajout, édition inline, suppression, exclusion des années du tirage

## Session du 30 avril 2026

- Migration vers Supabase (PostgreSQL managé, SDK CDN, plus de serveur)
- Table `journal` avec RLS : lecture publique, écriture authentifiée
- Modale de connexion à la demande (uniquement sur actions d'écriture)
- Bouton déconnexion dans le header
- Suppression de `server.js` et Express
- Déploiement GitHub Pages via GitHub Actions (secrets injectés au build)

## Session du 30 avril 2026 (suite)

- **Année max dynamique** — `new Date().getFullYear()` remplace le `2023` en dur ; wiring bouton GO déplacé dans `myscripts.js` (fini le `onclick` inline)
- **Animation du tirage** — effet rideau supprimé, remplacé par animation chiffre par chiffre (slot machine) : `rollSpeedMs`, `firstDigitSettleMs`, `delayPerDigitMs` à ajuster dans `animateDigits()`
- **Profils** — table `profiles` (id, name) créée dans Supabase avec RLS ; 4 participants insérés (Lisa, Laurent, Chris, Céline) ; `journal.profile_id` FK ajoutée, données existantes migrées depuis `picked_by`
- **Sélecteur de profil** — slide tirage : boutons profil + "Dernier choix : X" ; formulaire : select pré-rempli synchronisé avec la sélection du slide 1
- **Commentaires** — toujours en anglais

## Session du 1er mai 2026

- **Navigation** — tab bar fixe en bas (3 onglets : Tirage / Journal / Ajouter), Splide abandonné
- **Journal** — tri décroissant, filtre par profil
- **Tirage en attente** — table `pending_draw` ; bouton "Mémoriser ce tirage" ; bannière cliquable au-dessus du formulaire (pré-remplit année, profil, date) ; effacement après soumission
- **Modale de confirmation custom** — `showConfirm(message, label)` → Promise, remplace `confirm()` natif (journal + tirage en attente)
- **Bug fix "Dernier choix"** — `entries[0]` au lieu de `entries[entries.length-1]` (tri DESC)
- **Constante `MIN_YEAR`** (`1970`) dans `myscripts.js`
- **Fix Android safe area** — tab bar

---

## Contexte & décisions

### Flux réel des soirées

1. On regarde le film du soir
2. À la fin, la prochaine personne tire une année au sort
3. Elle choisit *en secret* un film de cette période (pas de genre imposé sauf : pas d'horreur)
4. Lors de la séance suivante, elle révèle son film — on le regarde
5. On saisit le journal *après* avoir vu le film (pas avant)

→ Il existe donc un état intermédiaire "tirage en attente" (personne X a tiré l'année Y, film non encore révélé)

### Choix technique — Vue 3 + Nuxt + Vercel

**Décision arrêtée :** migrer vers Vue 3 + Nuxt, déployé sur Vercel.

Critères ayant motivé le choix :
- Vue 3 + TypeScript déjà utilisés au quotidien → zéro nouvelle technologie à apprendre
- Nuxt apporte le routing file-based, les layouts et le middleware — indispensables pour les URL propres (fiches film) et le multi-tenant futur
- Nuxt *layers* : architecture native pour plusieurs groupes partageant le même codebase
- Capacitor + Ionic Vue pour la future app mobile iOS/Android (stack mature)
- Vercel : module officiel Nuxt, previews automatiques sur chaque branche

**Stratégie de migration :**
- Branche `nuxt-migration` pour tout le travail de refonte
- `main` reste intact → GitHub Pages continue de servir l'app actuelle pendant la transition
- Nuxt peut tourner en mode SSG (fichiers statiques) sur GitHub Pages si besoin d'un déploiement intermédiaire — limite : pas de redirections propres (GitHub Pages retourne 404 sur les URL directes type `/film/123`)
- Vercel connecté au repo dès le début → previews automatiques sur chaque push vers `nuxt-migration`
- Quand la nouvelle app est prête : merge dans `main` + bascule sur Vercel (pas de downtime)

**Frameworks écartés :**
- React — overkill pour ce projet
- SvelteKit — excellent techniquement, écarté car stack mobile moins mature et courbe d'apprentissage non nulle
- Vanilla JS + Vite — insuffisant pour le routing, le multi-tenant et le mobile à terme

### Architecture actuelle

```
movie-night/
├── app/
│   ├── app.vue                      — root (NuxtLayout + NuxtPage)
│   ├── assets/css/main.css          — design tokens + styles globaux
│   ├── types/index.ts               — Profile, JournalEntry, PendingDraw, ConfirmState
│   ├── composables/
│   │   ├── useProfiles.ts           — useState partagé, load()
│   │   ├── useJournal.ts            — CRUD + pickedYears + lastChooser
│   │   ├── usePendingDraw.ts        — load / save / remove
│   │   ├── useAuth.ts               — requireAuth, signIn, signOut, modal state
│   │   └── useConfirm.ts            — confirm() → Promise<boolean>
│   ├── components/
│   │   ├── ConfirmModal.vue         — Teleport, partagé via useState('confirmModal')
│   │   └── LoginModal.vue           — Teleport, partagé via useState('showLoginModal')
│   ├── layouts/
│   │   └── default.vue              — header + tab bar (NuxtLink) + modaux
│   └── pages/
│       ├── index.vue                — Tirage : profils, GO, animation, mémoriser
│       ├── journal.vue              — liste filtrée, édition inline, suppression
│       └── add.vue                  — formulaire + bannière tirage en attente
├── nuxt.config.ts                   — modules, CSS global, head (fonts, meta)
├── .env                             — SUPABASE_URL + SUPABASE_KEY (ignoré par git)
├── package.json                     — Nuxt 4 + @nuxtjs/supabase
├── .github/workflows/deploy.yml     — ancien workflow GitHub Pages (à supprimer après migration Vercel)
└── .gitignore
```

**En local :** `npm run dev` → http://localhost:3000

**Anciens fichiers** (toujours présents, à supprimer après validation) : `index.html`, `styles.css`, `myscripts.js`, `config.js`

### Supabase — tables

- `journal` : id, title, release_year, picked_by (nullable, legacy), profile_id (FK → profiles), watch_date
- `profiles` : id, name — RLS lecture publique, écriture authentifiée
  - Permissions explicites requises : `grant select on profiles to anon, authenticated;`
- `pending_draw` : id, profile_id (FK → profiles, on delete set null), year, drawn_at — RLS lecture publique, écriture authentifiée
  - Un seul enregistrement actif à la fois

### CSS — points d'attention mobile

- `height: 100vh` en fallback, `height: 100svh` en override (ordre important)
- Tab bar : `padding-bottom: max(env(safe-area-inset-bottom), 8px)` pour Android/iOS

### Points techniques à retenir

- `updateLastChooser` utilise `entries[0]` (tri DESC) — ne pas changer sans adapter
- `lastDrawnYear` n'est pas effacé après mémorisation : le bouton "Mémoriser" réapparaît si le tirage en attente est supprimé
- `showConfirm(message, label)` → Promise — utiliser avec `await` dans les handlers `async`
- `pending_draw` : un seul enregistrement actif à la fois, suppression par `delete().eq('id', pendingDraw.id)`

---

## À faire

**Migration (branche `nuxt-migration`) :**
- ~~Initialiser le projet Nuxt 4 + TypeScript~~ ✓
- ~~Migrer les 3 vues (Tirage / Journal / Ajouter) en pages Nuxt~~ ✓
- ~~Migrer `config.js` → `.env` (SUPABASE_URL + SUPABASE_KEY)~~ ✓
- ~~Connecter Vercel au repo~~ ✓ — URL prod : `movie-night-flax.vercel.app`, branche `nuxt-migration`
- Adapter le déploiement (supprimer l'ancien workflow GitHub Actions)
- Supprimer les anciens fichiers (`index.html`, `styles.css`, `myscripts.js`, `config.js`)

**Fonctionnalités à venir :**
- **Magic link** — expliquer le concept, décider si on l'adopte
- **TMDB** — après tirage : liste de films de l'année tirée ; depuis le journal : fiche film cliquable (URL propre `/film/:id`)
- **Votes / notes** — table `votes` (profile_id, journal_id, rating) → stats par personne et par chooser
- **Stats** — section dédiée avec graphiques : films par personne, moyenne des notes, années préférées
- **Multi-groupes** — plusieurs groupes avec journaux isolés (Nuxt layers + RLS Supabase par groupe)
- **App mobile** — Capacitor + Ionic Vue (iOS/Android) une fois l'app web stable
