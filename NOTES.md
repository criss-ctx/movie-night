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

## Session du 1er mai 2026 (suite)

- **Passe accessibilité & lisibilité** — branche `feat/a11y-readability`, mergée sur `main`
  - Tokens contraste relevés : `--text-secondary` `#9490a8` → `#b8b4cc` (6.5→9.5:1) ; `--text-faint` `#4f4b63` → `#928eb0` (2.3→6.4:1)
  - Opacité des bordures augmentée : `--border` 0.08→0.12, `--border-mid` 0.16→0.24, `--border-strong` 0.40→0.50
  - `:focus-visible` global ajouté (anneau doré 2px)
  - Tailles de police minimales relevées : labels 11→12px, tab-label 10→11px, memoriser-btn 11→12px
  - `@media (prefers-reduced-motion: reduce)` — animations du bouton GO désactivées
  - Modales : `role`, `aria-modal`, `aria-labelledby` ajoutés ; fermeture à la touche Escape

## Session du 1er mai 2026 (suite 2)

- **Thème dark / light** — branche `feat/theme-toggle`
  - `useTheme.ts` — composable (`useState`, `apply()`, `toggle()`, `init()`) ; persistance localStorage ; dark par défaut pour les nouveaux visiteurs
  - Script inline dans `<head>` (`nuxt.config.ts`) — applique `data-theme` avant le rendu pour éviter le flash (FOUC)
  - `[data-theme="light"]` — tokens parchemin chaud : `--bg #f5f3ee`, `--surface #ece8df`, `--text #1a1720`, `--accent #7a5c1e`, `--danger #b83232`, bordures rgba(0,0,0,…)
  - Bouton GO en thème clair — sépia chaud `#261a10` + Cormorant Garamond, animation press (`translateY` + shadow collapse), sans italic ; remplace le néon incohérent sur fond clair
  - Chiffres du tirage — `text-shadow` néon remplacé par encre chaude en thème clair
  - Profile-btn sélectionné — glow néon supprimé en thème clair (border accent uniquement)
  - Gradient du picker — `#252038` hardcodé remplacé par `var(--surface)`
  - Bouton soleil/lune dans le header (position absolute gauche), `init()` appelé au montage
  - `index.vue` — luminosité du `--glow-color` adaptée au thème (69% dark / 48% light)
  - `:focus:not(:focus-visible) { outline: none }` — supprime l'outline bleu au clic souris
  - `-webkit-tap-highlight-color: transparent` sur `button`, `a`, `.pending-banner`

## Session du 2 mai 2026 — Intégration TMDB

- **Branche** — `feat/tmdb`
- **Migration Supabase** — colonne `tmdb_id integer` nullable ajoutée à la table `journal`
- **Infrastructure TMDB** — token Bearer sécurisé via `runtimeConfig` (serveur uniquement) ; mock automatique quand `NUXT_TMDB_TOKEN` est absent
  - `server/api/tmdb/search.get.ts` — recherche par titre (`/3/search/movie`)
  - `server/api/tmxt/movie/[id].get.ts` — détail film (`/3/movie/{id}`)
  - `server/api/tmdb/discover.get.ts` — découverte par année (`/3/discover/movie`)
  - `server/mock/tmdb.ts` — données mock (Inception, The Dark Knight, Jurassic Park) + fallback générique
  - `app/composables/useTmdb.ts` — `searchMovies`, `getMovieDetail`, `discoverMovies`, `getPosterUrl`
- **Nouveaux types** — `TmdbMovie`, `TmdbMovieDetail`, `TmdbGenre`, `TmdbSearchResponse`, `TmdbDiscoverResponse`
- **Recherche autocomplete** (`add.vue`) — debounce 400ms sur le champ titre ; dropdown avec résultats TMDB ; sélection remplit titre, année et `tmdb_id` ; `tmdb_id` remis à `null` si l'utilisateur retape manuellement
- **Fiche film** (`/movie/[id]`) — affiche, titre, titre original, tagline, genres, durée, note TMDB, synopsis ; bouton retour ; placeholder si pas d'affiche
- **Bouton ℹ dans le journal** — visible uniquement sur les entrées avec `tmdb_id` ; navigue vers `/movie/[tmdb_id]`
- **Édition avec autocomplete** (`journal.vue`) — composant `EditEntryForm.vue` extrait ; même logique de recherche que `add.vue` ; `tmdb_id` mis à jour à la sauvegarde ; `display: contents` pour transparence grille CSS
- **Page découverte** (`/discover/[year]`) — grille d'affiches + 5 filtres (Populaires, Mieux notés, Box-office, Drama, Comédie) ; `useAsyncData` + `refresh()` au changement de filtre ; `loading="lazy"` sur les affiches
- **Bouton "Découvrir"** (`index.vue`) — apparaît uniquement après la fin de l'animation de tirage (`yearRevealed` ref, settée dans le `clearInterval` du dernier chiffre)
- **Disclaimer TMDB** — texte légal obligatoire dans le layout, sous la tab bar : *"This product uses the TMDB API but is not endorsed or certified by TMDB."*

## Session du 2 mai 2026 (suite) — feat/tmdb finalisée

- **Page `/about`** — attribution TMDB officielle (logo approuvé, texte légal exact, lien themoviedb.org) ; TMDB exige que l'attribution soit dans une section "About" ou "Credits", pas nécessairement sur chaque page
- **Footer simplifié** — `tmdb-attribution` supprimé du layout ; remplacé par un lien texte "À propos" → `/about` ; classe générique `.app-footer` / `.app-footer-link`
- **Infinite scroll** — page `/discover/[year]` : `IntersectionObserver` sur élément sentinelle en bas de grille ; chargement automatique de la page suivante ; `useAsyncData` conservé pour la page 1 (SSR), pages suivantes via `discoverMovies` direct + accumulation dans un `ref`
- **Liaison rétroactive** — couverte par l'édition inline existante (`EditEntryForm` avec autocomplete TMDB)

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
│   ├── types/index.ts               — Profile, JournalEntry, PendingDraw, ConfirmState, TmdbMovie, TmdbMovieDetail…
│   ├── composables/
│   │   ├── useProfiles.ts           — useState partagé, load()
│   │   ├── useJournal.ts            — CRUD + pickedYears + lastChooser
│   │   ├── usePendingDraw.ts        — load / save / remove
│   │   ├── useAuth.ts               — requireAuth, signIn, signOut, modal state
│   │   ├── useConfirm.ts            — confirm() → Promise<boolean>
│   │   ├── useTheme.ts              — toggle dark/light, persistance localStorage, init FOUC-safe
│   │   └── useTmdb.ts               — searchMovies, getMovieDetail, discoverMovies, getPosterUrl
│   ├── components/
│   │   ├── ConfirmModal.vue         — Teleport, partagé via useState('confirmModal')
│   │   ├── LoginModal.vue           — Teleport, partagé via useState('showLoginModal')
│   │   └── EditEntryForm.vue        — formulaire d'édition inline avec autocomplete TMDB (defineExpose getChanges)
│   ├── layouts/
│   │   └── default.vue              — header + tab bar + lien "À propos" + modaux
│   └── pages/
│       ├── index.vue                — Tirage : profils, GO, animation, mémoriser, bouton Découvrir
│       ├── journal.vue              — liste filtrée, édition via EditEntryForm, suppression
│       ├── add.vue                  — formulaire + autocomplete TMDB + bannière tirage en attente
│       ├── about.vue                — attribution TMDB officielle (logo, texte légal, lien)
│       ├── movie/
│       │   └── [id].vue             — fiche film TMDB (affiche, genres, note, synopsis)
│       └── discover/
│           └── [year].vue           — grille films par année avec 5 filtres + infinite scroll
├── server/
│   ├── api/tmdb/
│   │   ├── search.get.ts            — proxy /3/search/movie
│   │   ├── discover.get.ts          — proxy /3/discover/movie
│   │   └── movie/[id].get.ts        — proxy /3/movie/{id}
│   └── mock/tmdb.ts                 — données mock (fallback si NUXT_TMDB_TOKEN absent)
├── nuxt.config.ts                   — modules, runtimeConfig (tmdbToken), CSS global, head
├── .env                             — SUPABASE_URL + SUPABASE_KEY + NUXT_TMDB_TOKEN (ignoré par git)
├── .env.example                     — template des variables d'environnement
├── package.json                     — Nuxt 4 + @nuxtjs/supabase
└── .gitignore
```

**En local :** `npm run dev` → http://localhost:3000

**Anciens fichiers** (toujours présents, à supprimer après validation) : `index.html`, `styles.css`, `myscripts.js`, `config.js`

### Supabase — tables

- `journal` : id, title, release_year, picked_by (nullable, legacy), profile_id (FK → profiles), watch_date, tmdb_id (integer, nullable)
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

**Migration ✓ — terminée le 1er mai 2026 :**
- ~~Initialiser le projet Nuxt 4 + TypeScript~~ ✓
- ~~Migrer les 3 vues (Tirage / Journal / Ajouter) en pages Nuxt~~ ✓
- ~~Migrer `config.js` → `.env` (SUPABASE_URL + SUPABASE_KEY)~~ ✓
- ~~Connecter Vercel au repo~~ ✓ — URL prod : `movie-night-flax.vercel.app`
- ~~Supprimer workflow GitHub Actions + anciens fichiers vanilla JS~~ ✓
- ~~Merger `nuxt-migration` → `main`~~ ✓ — `main` est désormais la branche de production

**Workflow git (décidé le 1er mai 2026) :**
- Une branche par feature : `git switch -c feat/nom`
- `main` = prod, toujours stable et déployé sur Vercel
- Chaque branche génère une preview Vercel automatique
- Merge dans `main` quand la feature est prête et testée

**Fonctionnalités à venir :**
- ~~**Accessibilité & style** — audit contraste + tailles de police (WCAG AA minimum)~~ ✓ (1er mai 2026)
- ~~**Thème dark / light** — option de bascule par utilisateur~~ ✓ (1er mai 2026)
- **Magic link** — expliquer le concept, décider si on l'adopte
- ~~**TMDB** — après tirage : liste de films de l'année tirée ; depuis le journal : fiche film cliquable~~ ✓ (2 mai 2026)
- ~~**TMDB — page About**~~ ✓ (2 mai 2026) — page `/about` avec logo, texte légal, lien themoviedb.org ; footer simplifié en lien "À propos"
- ~~**TMDB — entrées existantes**~~ ✓ — couvert par l'édition inline avec autocomplete TMDB
- ~~**TMDB — pagination**~~ ✓ (2 mai 2026) — infinite scroll avec IntersectionObserver sur la page découverte
- **Votes / notes** — table `votes` (profile_id, journal_id, rating) → stats par personne et par chooser
- **Stats** — section dédiée avec graphiques : films par personne, moyenne des notes, années préférées
- **Multi-groupes** — plusieurs groupes avec journaux isolés (Nuxt layers + RLS Supabase par groupe)
- **App mobile** — Capacitor + Ionic Vue (iOS/Android) une fois l'app web stable
