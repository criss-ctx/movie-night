# Movie Night — Notes de session

## Sessions

### 29 avril 2026 — Prototype initial

- Serveur Express + journal.json
- Redesign mobile-first : fond ardoise, Cormorant Garamond, accent or, néon sur slide tirage
- Fonctionnalités journal : ajout, édition inline, suppression, exclusion des années du tirage

### 30 avril 2026 — Migration Supabase

- Migration vers Supabase (PostgreSQL managé, SDK CDN, suppression du serveur Express)
- Table `journal` avec RLS : lecture publique, écriture authentifiée
- Modale de connexion à la demande (uniquement sur actions d'écriture)
- Bouton déconnexion dans le header

### 30 avril 2026 (suite) — Améliorations tirage & profils

- Année max dynamique — `new Date().getFullYear()` remplace le `2023` en dur
- Animation du tirage — slot machine chiffre par chiffre (remplace l'effet rideau)
- Profils — table `profiles` (id, name) avec RLS ; 4 participants ; `journal.profile_id` FK
- Sélecteur de profil dans le slide tirage ; select pré-rempli dans le formulaire

### 1er mai 2026 — Navigation, journal & UX

- Tab bar fixe en bas (3 onglets : Tirage / Journal / Ajouter), abandon de Splide
- Journal — tri décroissant, filtre par profil
- Tirage en attente — table `pending_draw` ; bouton "Mémoriser" ; bannière pré-remplissage formulaire
- Modale de confirmation custom — `useConfirm()` → `Promise<boolean>`, remplace `confirm()` natif

### 1er mai 2026 (suite) — Accessibilité & thème

- Accessibilité — tokens contraste relevés, `:focus-visible` global, `aria-*` sur les modales, `prefers-reduced-motion`
- Thème dark / light — `useTheme.ts` avec `useState`, persistance localStorage, script inline anti-FOUC dans `<head>`
- Tokens light : parchemin chaud (`--bg #f5f3ee`), accent sépia (`#7a5c1e`)

### 2 mai 2026 — Intégration TMDB

- Infrastructure TMDB — token Bearer via `runtimeConfig` (serveur uniquement) ; mock si token absent
  - `server/api/tmdb/search.get.ts`, `movie/[id].get.ts`, `discover.get.ts`
  - `useTmdb.ts` — `searchMovies`, `getMovieDetail`, `discoverMovies`, `getPosterUrl`
- Autocomplete TMDB dans `add.vue` et `EditEntryForm.vue` (debounce 400ms, remplit `tmdb_id`)
- Page `/movie/[id]` — fiche film TMDB (affiche, genres, note, synopsis)
- Page `/discover/[year]` — grille films par année avec 5 filtres + infinite scroll (IntersectionObserver)
- Bouton "Découvrir" dans `index.vue` après l'animation de tirage
- Page `/about` — attribution TMDB officielle (logo approuvé, texte légal, lien)
- Footer simplifié — lien texte "À propos" remplace le disclaimer inline

### 2 mai 2026 (suite) — CSS scopé + extensions VS Code

- Migration CSS — `main.css` passe de 1 550 à 345 lignes ; styles migras dans `<style scoped>` par composant
- Extensions VS Code recommandées — `.vscode/extensions.json` + `.vscode/extensions.md`

### 2 mai 2026 (suite 2) — Refonte des cartes du journal

- `JournalCard.vue` — nouveau composant extrait de `journal.vue`
  - Clic sur la carte → navigation vers `/entry/[id]`
  - Swipe gauche → zone rouge delete révélée (mobile) ; swipe droite → zone dorée edit révélée
  - Desktop : hover zone bord gauche (40px) ou bord droit (44px) → translate de la carte de 52px (symétrique), révèle la zone colorée derrière ; self-hover uniquement via sélecteur CSS `~`, pas au hover général de la carte
- Route `/entry/[id]` — page unifiée pour toutes les entrées ; affiche les données TMDB si `tmdb_id` présent, sinon fallback avec les données Supabase uniquement ; bouton "Modifier"
- `EditEntryModal.vue` + `useEditEntry.ts` — modale d'édition (même pattern que `ConfirmModal` : `useState` singleton + `Promise`) ; animation scale-in ; Teleport body ; fermeture Escape/backdrop
- `useJournal.ts` — ajout de `getEntryById(id)`
- Types — ajout de `EditChanges` et `EditModalState`
- Simplifications — `journal.vue` et `JournalCard.vue` allégés : plus d'état d'édition inline, plus de `formRef` exposé, plus de `editingId`

### 2 mai 2026 (suite 3) — Correctifs cartes

- `EditEntryModal.vue` — dropdown TMDB affiché au-dessus du champ titre (`:deep(.search-dropdown)` avec `bottom: calc(100% + 4px)`) pour ne pas être masqué par le clavier virtuel mobile

### 9 mai 2026 (suite) — Identités & authentification magic link

- **`profiles`** — ajout colonnes `user_id UUID` (lien vers `auth.users`) et `is_admin BOOLEAN` ; 4 comptes Supabase Auth créés et liés ; Chris (id=3) marqué admin
- **Fonction SQL `is_admin()`** — helper `SECURITY DEFINER` réutilisé dans toutes les RLS
- **RLS renforcées** — `journal` et `pending_draw` UPDATE/DELETE : owner ou admin uniquement ; INSERT : UUID doit correspondre à un profil connu (`shouldCreateUser: false` côté client)
- **Magic link** — `useAuth.ts` : `signInWithOtp` remplace `signInWithPassword` ; watcher sur `user` pour exécuter l'action en attente si le lien est cliqué dans le même onglet
- **`LoginModal.vue`** — plus de champ password ; état `emailSent` affiche un message de confirmation après envoi

### 9 mai 2026 — TMDB étendu, tirage enrichi, badges

- **Fix** — cache TMDB stale sur `/entry/[id]` : `refresh()` appelé après save dans `handleModify`
- **Bannière tirage en attente** (`add.vue`) — redesign complet façon JournalCard : swipe gauche = supprimer le tirage entier (zone rouge), bouton "retirer ce film" inline, bouton primaire "Pré-remplir", lien secondaire "Explorer les films →" ; hover desktop via zone bord droit (44px)
- **Constantes genres** — `app/constants/tmdb.ts` et `server/constants/tmdb.ts` : `TMDB_EXCLUDED_GENRES` (TV movies exclus des résultats), `TMDB_WARNING_GENRES` (horreur = badge d'avertissement)
- **Recherche TMDB filtrée par année** — `primary_release_year` passé si le champ "Année de sortie" est rempli (`search.get.ts` + `useTmdb.ts`)
- **Exclusion genres** — TV movies retirés de la recherche et du discover (`without_genres` côté serveur)
- **Sélection de film sur le tirage** — migration Supabase : colonnes `tmdb_id` et `title` ajoutées à `pending_draw` ; `usePendingDraw.ts` : ajout de `setFilm(tmdbId, title)` et `clearFilm()` ; bouton +/✓ sur chaque carte de `discover/[year].vue` ; bouton "Choisir / Retirer ce film" sur `/movie/[id]`
- **Discover — 10 filtres** — Populaires, Mieux notés, Box-office, Pépites (note ≥ 7, ≥ 20 votes), Films français, Action, Thriller, Sci-fi, Drame, Comédie ; desktop : `flex-wrap: wrap` via `@media (hover: hover)` pour tout afficher sans scroll
- **Badge warning ⚠** — icône cercle ambre 26×26px sur les cartes discover et dans la section genres de `/movie/[id]` ; tap mobile = bandeau pleine largeur au bas du poster (2,5s auto-dismiss) ; hover desktop via CSS `:has(.genre-warning:hover)`
- **Badge "déjà vu"** — pill `vu` en haut-à-droite des cartes discover si le `tmdb_id` du film est déjà dans le journal (`watchedTmdbIds` computed = `Set` pour lookup O(1))
- **`MovieSearchOverlay.vue`** — overlay plein écran Teleport pour la recherche TMDB dans `EditEntryForm` (slide-up, Escape/backdrop pour fermer, badge ⚠ sur les résultats)

---

## Architecture

### Flux réel des soirées

1. On regarde le film du soir
2. La prochaine personne tire une année au sort
3. Elle choisit un film de cette période en secret (pas d'horreur)
4. Lors de la séance suivante, elle révèle son film — on le regarde
5. On saisit le journal *après* avoir vu le film

→ Il existe un état intermédiaire "tirage en attente" (année tirée, film non encore révélé)

### Stack

- **Frontend** — Vue 3 + Nuxt 4 + TypeScript, déployé sur Vercel
- **Base de données** — Supabase (PostgreSQL) avec RLS
- **API tierce** — TMDB (token côté serveur via `runtimeConfig`)
- **Authentification** — Supabase Auth, magic link (`signInWithOtp`)

### Structure du projet

```
movie-night/
├── app/
│   ├── app.vue
│   ├── assets/css/main.css          — tokens + styles globaux (345 lignes)
│   ├── types/index.ts               — Profile, JournalEntry, PendingDraw, ConfirmState,
│   │                                   EditChanges, EditModalState, Tmdb*
│   ├── composables/
│   │   ├── useProfiles.ts           — useState partagé, load()
│   │   ├── useJournal.ts            — CRUD + pickedYears + lastChooser + getEntryById
│   │   ├── usePendingDraw.ts        — load / save / setFilm / clearFilm / remove
│   │   ├── useAuth.ts               — requireAuth, signIn, signOut, modal state
│   │   ├── useConfirm.ts            — confirm() → Promise<boolean>
│   │   ├── useEditEntry.ts          — editEntry() → Promise<EditChanges|null>
│   │   ├── useTheme.ts              — toggle dark/light, persistance localStorage
│   │   └── useTmdb.ts               — searchMovies(q, year?), getMovieDetail, discoverMovies, getPosterUrl
│   ├── constants/
│   │   └── tmdb.ts                  — TMDB_EXCLUDED_GENRES (TV movies), TMDB_WARNING_GENRES (horreur)
│   ├── components/
│   │   ├── ConfirmModal.vue         — Teleport + useState singleton
│   │   ├── LoginModal.vue           — Teleport + useState singleton
│   │   ├── EditEntryModal.vue       — Teleport + useState singleton (édition d'entrée)
│   │   ├── EditEntryForm.vue        — formulaire avec autocomplete TMDB (display:contents)
│   │   ├── JournalCard.vue          — carte avec swipe mobile + hover desktop
│   │   └── MovieSearchOverlay.vue   — overlay plein écran recherche TMDB (Teleport, slide-up)
│   ├── layouts/
│   │   └── default.vue              — header + tab bar + footer + modales globales
│   └── pages/
│       ├── index.vue                — Tirage : profils, GO, animation, mémoriser, Découvrir
│       ├── journal.vue              — liste filtrée par profil
│       ├── add.vue                  — formulaire + autocomplete TMDB + bannière tirage (swipe)
│       ├── about.vue                — attribution TMDB officielle
│       ├── entry/
│       │   └── [id].vue             — fiche unifiée (TMDB + fallback) par ID d'entrée Supabase
│       ├── movie/
│       │   └── [id].vue             — fiche film TMDB + sélection tirage + badge warning
│       └── discover/
│           └── [year].vue           — grille films + 10 filtres + infinite scroll + badges (vu, ⚠, +/✓)
├── server/
│   ├── api/tmdb/
│   │   ├── search.get.ts            — proxy /3/search/movie (+ primary_release_year, without_genres)
│   │   ├── discover.get.ts          — proxy /3/discover/movie (+ vote_average.gte, with_original_language)
│   │   └── movie/[id].get.ts        — proxy /3/movie/{id}
│   ├── constants/
│   │   └── tmdb.ts                  — TMDB_EXCLUDED_GENRES (join ','), TMDB_WARNING_GENRES
│   └── mock/tmdb.ts                 — données mock si NUXT_TMDB_TOKEN absent
```

### Supabase — tables

- `journal` — id, title, release_year, profile_id (FK), watch_date, tmdb_id (nullable)
- `profiles` — id, name, user_id (FK → auth.users), is_admin — RLS lecture publique ; écriture owner ou admin
- `pending_draw` — id, profile_id (FK, on delete set null), year, drawn_at, tmdb_id (nullable), title (nullable) — un seul enregistrement actif

### Workflow git

- `main` = prod, toujours stable, déployé sur Vercel (`movie-night-flax.vercel.app`)
- Une branche par feature : `git switch -c feat/nom`
- Chaque push génère une preview Vercel automatique

### Points d'attention techniques

- `lastChooser` utilise `entries[0]` (tri DESC) — ne pas changer sans adapter
- `lastDrawnYear` non effacé après mémorisation : le bouton "Mémoriser" réapparaît si `pending_draw` est supprimé
- `pending_draw` : un seul enregistrement actif, suppression par `delete().eq('id', id)`
- CSS `height: 100svh` (avec fallback `100vh`) ; tab bar `padding-bottom: max(env(safe-area-inset-bottom), 8px)`
- `.digit` / `.digit.settled` en `:global()` — spans créés via `innerHTML`, hors portée du compilateur Vue

---

## À faire

> Voir **[PLAN_AUTH_IDENTITES.md](./PLAN_AUTH_IDENTITES.md)** pour le plan détaillé et l'état d'avancement du refactoring identités/auth (4 phases : liaison profils↔auth, magic link, film secret, votes).

- **Identités & données privées** — 4 phases planifiées dans `PLAN_AUTH_IDENTITES.md` *(en cours)*
- **Votes / notes** — table `votes` (profile_id, journal_id, rating) → affichage sur la fiche `/entry/[id]`
- **Stats** — section dédiée : films par personne, moyenne des notes, années préférées
- **Multi-groupes** — plusieurs groupes avec journaux isolés (Nuxt layers + RLS Supabase par groupe)
- **App mobile** — Capacitor + Ionic Vue (iOS/Android) une fois l'app web stable
