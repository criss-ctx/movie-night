# Movie Night — Devlog

Application de soirée ciné pour un groupe fixe de 4 participants.
Chaque année, un film est tiré au sort parmi les années proposées, visionné ensemble, puis noté.

Ce fichier retrace l'ensemble des réflexions, décisions, planifications et changements du projet.

---

## État des fonctionnalités

| Fonctionnalité | Statut |
|----------------|--------|
| Stack Vue 3 + Nuxt + Vercel + Supabase | ✅ |
| Navigation tab bar, thème dark/light | ✅ |
| Journal (tri, filtre, swipe mobile) | ✅ |
| Tirage en attente + modale confirm | ✅ |
| Intégration TMDB (routes serveur, composable, autocomplete) | ✅ |
| Fiches film `/movie/[id]` + `MovieDetailView` partagé | ✅ |
| Certification CNC, sociétés de prod, fiches personnes | ✅ |
| Streaming availability (JustWatch via TMDB) | ✅ |
| Bandes annonces (embed YouTube) | ✅ |
| Design system typographique (tokens CSS) | ✅ |
| Accessibilité mobile (tailles polices + touch targets) | ✅ |
| Backdrop ambiant sur fiches film | ✅ |
| Auth — profils liés à Supabase Auth | ✅ |
| Magic link PKCE | ✅ |
| Film secret (`pending_movie`) | ✅ |
| Avatars profils | ✅ |
| Votes & notes (système complet) | ✅ |
| Page stats (4ème onglet) | ⬜ Session dédiée |
| Rappel email non-votants (Resend) | ⬜ Déféré |
| Collections / sagas TMDB | ⬜ |
| Films similaires TMDB | ⬜ |

---

## Auth & Identités

Refactoring en 4 phases pour lier chaque participant à un compte Supabase Auth,
sécuriser le film secret, et poser la fondation du système de votes.

### Phase 1 — Lier les profils aux comptes Auth ✅

> Fondation invisible — aucun changement UI. Toutes les RLS des phases suivantes dépendent de cette jointure.

**SQL :**
```sql
ALTER TABLE profiles
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
```

Helper admin réutilisable (évite de dupliquer la logique dans chaque policy) :
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

RLS `journal` :
```sql
CREATE POLICY "owner or admin can modify journal"
ON journal FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
);
```

RLS `pending_draw` :
```sql
CREATE POLICY "owner or admin can write pending_draw"
ON pending_draw FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  OR is_admin()
);
```

**Note post-implémentation :** `useSupabaseUser()` retourne le payload JWT brut (claim `sub`) plutôt que le type TypeScript `User` (propriété `id`). Toujours utiliser `(user.value as any).sub ?? user.value?.id` côté client pour comparer avec `profile.user_id`.

---

### Phase 2 — Magic link ✅

> Remplace `signInWithPassword` par `signInWithOtp`.

Comportement cible :
```
User saisit email → clic "Envoyer le lien"
→ état "Vérifie ta boîte mail 📬"
→ clic sur le lien dans l'email → authentifié, modale fermée
```

**Notes post-implémentation :**
- `emailRedirectTo` doit pointer sur `/confirm` (pas `window.location.origin`) pour que `@supabase/ssr` échange le code PKCE et établisse une session persistante avec refresh silencieux
- `app/pages/confirm.vue` à créer manuellement — `@nuxtjs/supabase` v2 ne la génère pas
- Rate limit GoTrue : 2 emails/h sur le free tier → résolu avec SMTP custom Gmail + mot de passe d'application Google
- `shouldCreateUser: false` — emails inconnus rejetés silencieusement (pas de nouveaux comptes créés)

---

### Phase 3 — Film secret (`pending_movie`) ✅

> Scinder `pending_draw` : la partie publique reste, le film choisi devient privé.

| Donnée | Visibilité |
|--------|-----------|
| `profile_id`, `year`, `drawn_at` | Tout le monde |
| `tmdb_id`, `title` (film choisi) | Owner uniquement |

**SQL (exécuté en prod) :**
```sql
CREATE TABLE pending_movie (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pending_draw_id BIGINT REFERENCES pending_draw(id) ON DELETE CASCADE,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
  tmdb_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_movie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read pending_movie"
ON pending_movie FOR SELECT
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "owner can write pending_movie"
ON pending_movie FOR ALL
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));
```

Colonnes `tmdb_id`/`title` supprimées de `pending_draw` le 2026-05-28 après déploiement validé.

**Fichiers modifiés :** `types/index.ts`, `composables/usePendingDraw.ts`, `pages/add.vue`, `pages/movie/[id].vue`, `pages/discover/[year].vue`

---

### Phase 4 — Votes & notes ✅

Voir section dédiée ci-dessous.

---

## Votes & Notes

### Décisions de design

**Thème de la soirée :** film marquant de l'année tirée au sort (récompensé/remarqué, voulu à découvrir, ou déjà vu à faire découvrir). Pas de champ déclaratif sur `journal`.

**Échelle :** 1–10, slider draggable. Moyennes en numérique (`7.3 / 10`). `rating_pick` exclut le vote du picker.

**Formulaire conditionnel picker / non-picker :**

| Champ | Picker | Non-picker | Condition |
|-------|--------|-----------|-----------|
| `rating_film` | ✓ | ✓ | Toujours |
| `rating_pick` | ✗ | ✓ | Toujours (non-picker) |
| `already_seen` | ✓ | ✓ | Toujours |
| `happy_to_rewatch` | ✓ | ✓ | Si `already_seen = true` |
| `prior_knowledge` | ✗ | ✓ | Si `already_seen ≠ true` |
| `wanted_to_see` | ✗ | ✓ | Si `prior_knowledge = true` |
| `surprised_by_pick` | ✗ | ✓ | Toujours (non-picker, en dernier) |

> `wanted_to_see` = intérêt a priori, pas lié à la soirée. Compatible avec "Surpris".

**Tags nominatifs dans les résultats :**

| Condition | Label |
|-----------|-------|
| `already_seen = true` + `happy_to_rewatch ≠ true` | Déjà vu |
| `already_seen = true` + `happy_to_rewatch = true` | Content de le revoir |
| `already_seen = false` + `prior_knowledge = false` | Découverte |
| `prior_knowledge = true` + `wanted_to_see = true` | Voulait le voir |
| `prior_knowledge = true` + `wanted_to_see = false` | Pas attiré |
| `surprised_by_pick = true` | Surpris |

> Cas silencieux (aucun tag) : `already_seen = null`, `happy_to_rewatch = false`, `prior_knowledge = null`, `wanted_to_see = null`, `surprised_by_pick = false`. `prior_knowledge = null` ≠ `prior_knowledge = false` — seul le `false` explicite déclenche "Découverte".

**Affichage des résultats (état verrouillé) :**
- Moyennes `rating_film` et `rating_pick` en haut (encadré)
- Liste membres : avatar + prénom + badge "Sélectionneur" pour le picker + tags
- Notes individuelles non affichées (moyennes anonymes uniquement)
- Picker mis en avant (fond différencié + badge accent)

**Verrou :** automatique quand `COUNT(votes) = COUNT(profiles)`, calculé dynamiquement. Votes modifiables avant verrou.

### Schéma SQL (déployé en prod)

```sql
CREATE TABLE votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  journal_id BIGINT REFERENCES journal(id) ON DELETE CASCADE NOT NULL,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE SET NULL,

  rating_film    SMALLINT CHECK (rating_film  BETWEEN 1 AND 10),
  rating_pick    SMALLINT CHECK (rating_pick  BETWEEN 1 AND 10),

  already_seen      BOOLEAN,
  happy_to_rewatch  BOOLEAN,
  prior_knowledge   BOOLEAN,
  wanted_to_see     BOOLEAN,
  surprised_by_pick BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, profile_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes are public"
ON votes FOR SELECT USING (true);

CREATE POLICY "owner can write vote"
ON votes FOR ALL
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON votes TO anon, authenticated;
```

### Statistiques exploitables

| Question | Champs |
|----------|--------|
| Meilleur film de l'année | `rating_film` moyen |
| Meilleur picker | `rating_pick` moyen (hors son propre vote) |
| Plus grande découverte | `prior_knowledge = false` + `rating_film` élevé |
| Coup de cœur inattendu | `surprised_by_pick = true` + `rating_film` élevé |
| Classique confirmé | `already_seen = true` + `happy_to_rewatch = true` + `rating_film` élevé |
| Choix audacieux réussi | `surprised_by_pick = true` + `rating_pick` élevé |
| Film très attendu tenu | `wanted_to_see = true` + `rating_film` élevé |
| Film qui a converti | `wanted_to_see = false` + `rating_film` élevé |

---

## Intégration TMDB

### Ce qui est implémenté

- Routes serveur : `movie/[id].get.ts`, `discover/[year].get.ts`, `providers/[id].get.ts`, `videos/[id].get.ts`, `person/[id].get.ts`
- Composable `useTmdb` : `getMovieDetail`, `getWatchProviders`, `getBestTrailer`, `getPosterUrl`, autocomplete recherche
- `MovieDetailView.vue` — composant partagé entre `/movie/[id]` et `/entry/[id]` : affiche, titre, faits (année/durée/pays), genres, certification CNC, rating TMDB, tagline, synopsis tronqué, crédits (réalisation, casting, production), streaming, bandes annonces, backdrop ambiant
- Fiches personnes (modal `PersonModal.vue`)
- Streaming availability via JustWatch (données TMDB) — Netflix exclu des données disponibles
- Bandes annonces : embed YouTube via `youtube-nocookie.com`, FR prioritaire, fallback EN
- Backdrop ambiant : `backdrop_path` (w1280) poussé dans `useState('appBackdropUrl')` depuis `MovieDetailView`, rendu à `opacity: 0.05` (dark) / `0.12` (light) derrière `app-content` dans `default.vue`

### Décisions de design TMDB

- **Backdrop** : approche "fond atténué de page" retenue plutôt que banner au-dessus de l'affiche (évite la redondance visuelle avec le poster portrait). `isolation: isolate` sur `app-content` + `z-index: -1` sur le backdrop pour le contenir dans le bon contexte d'empilement.
- **Streaming** : JustWatch via TMDB (pas d'API JustWatch directe). Netflix absent des données — Watchmode identifié comme complément éventuel si ça devient problématique.

### À venir

- **Collections / sagas** — `belongs_to_collection` via `append_to_response` dans `movie/[id].get.ts` → "Fait partie de *Saga X*" sur la fiche
- **Films similaires** — endpoint `/movie/{id}/similar`, nouvelle route `similar/[id].get.ts`, section collapsible en bas de `MovieDetailView`

---

## Page Stats (étape 4.9)

### Contexte (au 2026-05-28)
- 13 films dans le journal
- Stats par **année de visionnage** (`watch_date` year), pas par année tirée
- **Périmètre v1 : 2024 et 2025 uniquement** — 2026 et palmarès global exclus pour l'instant
- Données publiques — 4ème onglet de la tab bar

### Structure envisagée (v1)

Section "Année 2025" puis "Année 2024" :
- 🏆 Film préféré (meilleure moyenne `rating_film`)
- 🎯 Meilleur choix (meilleure moyenne `rating_pick`, hors picker)
- 😮 Coup de cœur inattendu (`surprised_by_pick = true` + `rating_film` élevé)
- 🔍 Plus grande découverte (`prior_knowledge = false` + `rating_film` élevé)

### Évolutions futures (hors scope v1)
- Année 2026 et au-delà
- Palmarès global toutes années confondues
- Animation "Wrapped" en fin d'année (décembre)

### Implémentation prévue
- SQL aggregats (Supabase views ou RPC) — pas de calcul client-side
- JOIN `votes` × `journal` × `profiles`

---

## Journal des sessions

### Avant 2026-05-28 — Construction de la base

- Stack migrée vers **Vue 3 + Nuxt + Vercel** (depuis GitHub Pages)
- Navigation tab bar, thème dark/light, journal tri/filtre, tirage en attente, modale confirm
- Intégration TMDB complète : routes serveur, composable, autocomplete, `/movie/[id]`, `/discover/[year]`, `/about`
- `MovieDetailView.vue` — composant partagé `/movie/[id]` et `/entry/[id]`
- Certification CNC, sociétés de production, fiches personnes TMDB
- Streaming availability via JustWatch/TMDB (`providers/[id].get.ts`)
- `MovieSearchOverlay.vue` — overlay plein écran pour édition d'une entrée
- Refonte cartes journal : `JournalCard.vue` swipe mobile + hover desktop, `EditEntryModal.vue`
- Auth phases 1–3 : profils liés à auth.users, magic link PKCE, film secret `pending_movie`
- Avatars profils : `UserAvatar.vue`, colonne `avatar TEXT` sur `profiles`

### 2026-05-28 — Design du système de votes

- Schéma finalisé : 2 ratings (1–10) + 5 booléens avec logique conditionnelle
- Verrou automatique quand tout le groupe a voté ; votes modifiables avant verrou
- Décision : notes individuelles non visibles, seulement les moyennes anonymes
- Décision : `rating_pick` exclu du formulaire picker

### 2026-05-29 — Implémentation votes

- Échelle passée de 1–5 à 1–10 (slider draggable, moyenne numérique)
- `rating_pick` exclu du calcul de sa propre moyenne
- Formulaire conditionnel picker vs non-picker implémenté
- Badge "Sélectionneur" dans les résultats
- Labels résultats finalisés : Déjà vu, Content de le revoir, Découverte, Voulait le voir, Pas attiré, Surpris
- Précision : `wanted_to_see` = intérêt a priori (pas lié à la soirée), compatible avec "Surpris"
- `database.types.ts` créé pour typage Supabase correct (résout erreur upsert)
- Rappel email (Resend) déféré à plus tard

### 2026-06-07 — Trailers, design system, accessibilité, backdrop

- **Bandes annonces** — route `/api/tmdb/videos/[id]`, `getBestTrailer` dans `useTmdb`, bouton embed YouTube sous l'affiche dans `MovieDetailView` (FR prioritaire, fallback EN)
- **Design system typographique** — tokens `--text-caption/meta/label/body/title` + `--leading-*` dans `:root` (main.css), propagés dans 15 fichiers ; textes de lecture à `var(--text-body)` = 16px
- **Accessibilité mobile** — passage global des polices (+2px), logos providers 32→44px, icônes tab bar 20→24px, slider thumb votes 20→28px
- **Backdrop ambiant** — `backdropUrl` (w1280) via `useState` depuis `MovieDetailView`, rendu à `opacity: 0.05` (dark) / `0.12` (light) derrière `app-content` ; `isolation: isolate` + `z-index: -1` ; sélecteur `[data-theme="light"]` sur `<html>` pour l'opacité différenciée
