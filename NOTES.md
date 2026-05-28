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

### 9 mai 2026 — Identités & authentification magic link

- **`profiles`** — ajout colonnes `user_id UUID` (lien vers `auth.users`) et `is_admin BOOLEAN` ; 4 comptes Supabase Auth créés et liés ; Chris (id=3) marqué admin
- **Fonction SQL `is_admin()`** — helper `SECURITY DEFINER` réutilisé dans toutes les RLS
- **RLS renforcées** — `journal` et `pending_draw` UPDATE/DELETE : owner ou admin uniquement ; INSERT relaxé à `auth.role() = 'authenticated'` (un owner peut ajouter pour n'importe quel profil)
- **Magic link** — `useAuth.ts` : `signInWithOtp` remplace `signInWithPassword` ; `shouldCreateUser: false` rejette silencieusement les emails inconnus ; watcher sur `user` pour exécuter l'action en attente si le lien est cliqué dans le même onglet
- **`LoginModal.vue`** — plus de champ password ; état `emailSent` (mis à `true` uniquement en succès) affiche un message de confirmation après envoi

### 10 mai 2026 — Film secret, PKCE, icônes auth

- **Table `pending_movie`** — nouvelle table (tmdb_id, title, pending_draw_id, profile_id) avec RLS owner-only ; remplace les colonnes `tmdb_id`/`title` de `pending_draw` (à supprimer après validation avec `ALTER TABLE pending_draw DROP COLUMN tmdb_id, DROP COLUMN title`)
- **`movie_chosen BOOLEAN`** — ajouté à `pending_draw` : indicateur public qu'un film a été choisi, sans révéler lequel
- **GRANT sur `pending_movie`** — `GRANT SELECT ON pending_movie TO anon` nécessaire même avec RLS pour que le join Supabase ne retourne pas 403
- **`isAdmin` computed** — `add.vue` : admin peut "annuler le choix" d'un film choisi par un autre utilisateur, sans voir lequel
- **Fix PKCE** — `emailRedirectTo` corrigé de `window.location.origin` à `${window.location.origin}/confirm` dans `useAuth.ts` ; `@nuxtjs/supabase` utilise le flux PKCE qui exige que le code d'auth arrive sur la route `/confirm` pour établir la session et activer le refresh silencieux — sans ce fix les sessions expiraient après ~1h
- **Icônes SVG** — login/logout dans `default.vue` : icônes stroke-based 18×18 remplaçant les caractères unicode ↩/↪ peu lisibles
- **Rate limit OTP** — limite au niveau GoTrue (2 emails/h sur le free tier, non éditable) ; résolu en configurant un SMTP custom Gmail (Authentication → Email → SMTP Settings) avec un mot de passe d'application Google — les magic links transitent désormais par `criss.ctx@gmail.com`, sans limite de projet
- **Fix race condition `pendingAction`** — `useAuth.ts` : action capturée et `pendingAction` mis à `null` *avant* l'`await`, évite que les 3 instances de `watch(user)` (default.vue, add.vue, index.vue) exécutent toutes l'action en simultané → doublons en journal
- **Page `/confirm`** — `app/pages/confirm.vue` créée manuellement ; `@nuxtjs/supabase` v2 ne la génère pas automatiquement ; `createBrowserClient` de `@supabase/ssr` détecte le `?code=` et échange le token PKCE dès que la page se charge ; redirige vers `/` via `watch(user, ..., { once: true })` dès que la session est établie

### 28 mai 2026 — Bug fix année + streaming availability

- **Bug fix** — `discover/[year].vue` et `movie/[id].vue` : bouton "choisir" masqué si l'année de la page ne correspond pas à `pendingDraw.year` ; exception si le film est déjà choisi (pour permettre le retrait)
- **Phase 3 clôturée** — RLS `pending_movie` validée ; `ALTER TABLE pending_draw DROP COLUMN tmdb_id, DROP COLUMN title` exécuté
- **Streaming availability** ✅ — endpoint TMDB `/3/movie/{id}/watch/providers` (JustWatch) ; proxy `server/api/tmdb/providers/[id].get.ts` ; flatrate + location sur `/movie/[id]` et `/entry/[id]`
- **Convention commit** — tous les commits doivent être en anglais (les commits français passés étaient une erreur)

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

### 10 mai 2026 (suite) — Avatars profils

- **Colonne `avatar TEXT`** — ajoutée à `profiles` (nullable) ; valeur saisie manuellement dans le dashboard Supabase (emoji)
- **`UserAvatar.vue`** — nouveau composant : affiche l'emoji si défini, sinon les initiales (1-2 lettres) sur fond coloré ; couleur bg et texte dérivées du nom via hash `charCodeAt` → teinte oklch (`oklch(48% 0.14 hue)` bg / `oklch(92% 0.06 hue)` texte) ; uniformité perceptuelle garantie sur toutes les teintes
- **`default.vue`** — header restructuré : `.header-right` wrapper positionné absolument à droite, contient `UserAvatar` + bouton déconnexion séparés (cliquer sur l'avatar ne déconnecte plus)
- **Bug fix `.sub` vs `.id`** — `useSupabaseUser()` retourne le payload JWT brut (claim `sub`) plutôt que le type TypeScript `User` (propriété `id`) ; corrigé dans `default.vue` et `index.vue` avec le pattern `(user.value as any).sub ?? user.value.id`

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
│   │   ├── MovieSearchOverlay.vue   — overlay plein écran recherche TMDB (Teleport, slide-up)
│   │   └── UserAvatar.vue           — cercle avatar : emoji ou initiales + couleur oklch déterministe
│   ├── layouts/
│   │   └── default.vue              — header + tab bar + footer + modales globales
│   └── pages/
│       ├── index.vue                — Tirage : profils, GO, animation, mémoriser, Découvrir
│       ├── journal.vue              — liste filtrée par profil
│       ├── add.vue                  — formulaire + autocomplete TMDB + bannière tirage (swipe)
│       ├── about.vue                — attribution TMDB officielle
│       ├── confirm.vue              — callback PKCE magic link (échange ?code= → session → redirect /)
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
- `profiles` — id, name, user_id (FK → auth.users), is_admin, avatar (TEXT nullable) — RLS lecture publique ; écriture owner ou admin
- `pending_draw` — id, profile_id (FK, on delete set null), year, drawn_at, movie_chosen (bool) — un seul enregistrement actif
- `pending_movie` — id, pending_draw_id (FK cascade), profile_id (FK), tmdb_id, title — RLS owner-only ; visible uniquement par celui qui a choisi le film

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

- **Identités & données privées** — 4 phases planifiées dans `PLAN_AUTH_IDENTITES.md` ✅ Phases 1–3 terminées, Phase 4 (votes) à faire
- **Streaming availability** ✅ — endpoint TMDB `/watch/providers` (JustWatch), affichage flatrate + location sur `/movie/[id]` et `/entry/[id]`, tooltip CSS `::after`, disclaimer Netflix
- **Votes / notes** — table `votes` (profile_id, journal_id, rating) → affichage sur la fiche `/entry/[id]`
- **Watchmode (éventuel)** — watchmode.com peut compléter JustWatch pour afficher Netflix (absent de TMDB/JustWatch FR) ; free tier 1000 req/jour ; nécessite fusion des sources dans `providers/[id].get.ts`
- **Stats** — section dédiée : films par personne, moyenne des notes, années préférées
- **Multi-groupes** — plusieurs groupes avec journaux isolés (Nuxt layers + RLS Supabase par groupe)
- **App mobile** — Capacitor + Ionic Vue (iOS/Android) une fois l'app web stable
