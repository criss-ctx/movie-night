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
- **Authentification** — Supabase Auth (email + magic link prévu)

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
│   │   ├── usePendingDraw.ts        — load / save / remove
│   │   ├── useAuth.ts               — requireAuth, signIn, signOut, modal state
│   │   ├── useConfirm.ts            — confirm() → Promise<boolean>
│   │   ├── useEditEntry.ts          — editEntry() → Promise<EditChanges|null>
│   │   ├── useTheme.ts              — toggle dark/light, persistance localStorage
│   │   └── useTmdb.ts               — searchMovies, getMovieDetail, discoverMovies, getPosterUrl
│   ├── components/
│   │   ├── ConfirmModal.vue         — Teleport + useState singleton
│   │   ├── LoginModal.vue           — Teleport + useState singleton
│   │   ├── EditEntryModal.vue       — Teleport + useState singleton (édition d'entrée)
│   │   ├── EditEntryForm.vue        — formulaire avec autocomplete TMDB (display:contents)
│   │   └── JournalCard.vue          — carte avec swipe mobile + hover desktop
│   ├── layouts/
│   │   └── default.vue              — header + tab bar + footer + modales globales
│   └── pages/
│       ├── index.vue                — Tirage : profils, GO, animation, mémoriser, Découvrir
│       ├── journal.vue              — liste filtrée par profil
│       ├── add.vue                  — formulaire + autocomplete TMDB + bannière tirage en attente
│       ├── about.vue                — attribution TMDB officielle
│       ├── entry/
│       │   └── [id].vue             — fiche unifiée (TMDB + fallback) par ID d'entrée Supabase
│       ├── movie/
│       │   └── [id].vue             — fiche film TMDB par tmdb_id (utilisée depuis /discover)
│       └── discover/
│           └── [year].vue           — grille films par année + 5 filtres + infinite scroll
├── server/api/tmdb/
│   ├── search.get.ts                — proxy /3/search/movie
│   ├── discover.get.ts              — proxy /3/discover/movie
│   └── movie/[id].get.ts            — proxy /3/movie/{id}
└── server/mock/tmdb.ts              — données mock si NUXT_TMDB_TOKEN absent
```

### Supabase — tables

- `journal` — id, title, release_year, profile_id (FK), watch_date, tmdb_id (nullable)
- `profiles` — id, name — RLS lecture publique, écriture authentifiée
- `pending_draw` — id, profile_id (FK, on delete set null), year, drawn_at — un seul enregistrement actif

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
- **`/entry/[id]` — données TMDB stale après changement de film** : `entry.value` est rechargé après save, mais `movie` (cache `useAsyncData`) reste sur l'ancien film jusqu'à navigation. Fix prévu : `refreshNuxtData` ou `ref` manuel rechargé après save.

---

## À faire

- **Magic link** — expliquer le concept, décider si on l'adopte
- **`/entry/[id]` — stale TMDB après édition** — invalider le cache `useAsyncData` après changement de `tmdb_id` (voir note technique ci-dessus)
- **Votes / notes** — table `votes` (profile_id, journal_id, rating) → affichage sur la fiche `/entry/[id]`
- **Stats** — section dédiée : films par personne, moyenne des notes, années préférées
- **Multi-groupes** — plusieurs groupes avec journaux isolés (Nuxt layers + RLS Supabase par groupe)
- **App mobile** — Capacitor + Ionic Vue (iOS/Android) une fois l'app web stable
