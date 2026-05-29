# Plan — Système de votes / notes

Suivi de la Phase 4 du plan d'identités & auth.
Voir aussi : `PLAN_AUTH_IDENTITES.md`

---

## État d'avancement

| Étape | Titre | Statut |
|-------|-------|--------|
| 4.1 | Design du schéma (champs, contraintes) | ✅ Validé |
| 4.2 | SQL — création table `votes` + RLS | ✅ Fait |
| 4.3 | Types TypeScript + `database.types.ts` | ✅ Fait |
| 4.4 | Composable `useVotes.ts` | ✅ Fait |
| 4.5 | Formulaire de vote sur `/entry/[id]` | ✅ Fait |
| 4.6 | Résultats verrouillés (moyennes + tags) | ✅ Fait |
| 4.7 | Mécanisme de rappel (email via Resend) | ⬜ Déféré |
| 4.8 | Affichage résultats affiné | ✅ Fait (intégré dans 4.6) |
| 4.9 | Page stats (4ème onglet tab bar) | ⬜ Session dédiée |

---

## Décisions de design (validées)

### Thème de la soirée

Un seul thème immuable : **film marquant de l'année tirée au sort**.
Film récompensé/remarqué par la critique, film voulu à découvrir, ou film déjà vu à faire découvrir.
→ Pas de champ déclaratif sur `journal`.

### Ratings

- Échelle **1–10** (slider draggable, pas d'étoiles)
- Moyennes affichées en numérique : `7.3 / 10`
- **`rating_pick` exclut le vote du picker** (il ne note pas son propre choix)

### Champs et logique d'affichage dans le formulaire

| Champ | Picker | Non-picker | Condition |
|-------|--------|-----------|-----------|
| `rating_film` | ✓ | ✓ | Toujours |
| `rating_pick` | ✗ | ✓ | Toujours (non-picker) |
| `already_seen` | ✓ | ✓ | Toujours |
| `happy_to_rewatch` | ✓ | ✓ | Si `already_seen = true` |
| `prior_knowledge` | ✗ | ✓ | Si `already_seen ≠ true` |
| `wanted_to_see` | ✗ | ✓ | Si `prior_knowledge = true` |
| `surprised_by_pick` | ✗ | ✓ | Toujours (non-picker, en dernier) |

> `wanted_to_see` = "ce film m'intéressait (pas forcément dans le cadre de cette soirée)".
> Les membres ne voient pas la liste des films à l'avance — surprise préservée.

### Labels affichés dans les résultats (tags nominatifs)

| Condition | Label |
|-----------|-------|
| `already_seen = true` + `happy_to_rewatch ≠ true` | **Déjà vu** |
| `already_seen = true` + `happy_to_rewatch = true` | **Content de le revoir** (remplace "Déjà vu") |
| `already_seen = false` + `prior_knowledge === false` | **Découverte** |
| `prior_knowledge = true` + `wanted_to_see = true` | **Voulait le voir** |
| `prior_knowledge = true` + `wanted_to_see = false` | **Pas attiré** |
| `surprised_by_pick = true` | **Surpris** |

> Cas silencieux (aucun tag) : `already_seen = null`, `happy_to_rewatch = false`,
> `prior_knowledge = null`, `wanted_to_see = null`, `surprised_by_pick = false`.
> `prior_knowledge = null` ≠ `prior_knowledge = false` — seul le `false` explicite déclenche "Découverte".

### Affichage des résultats (état verrouillé)

- Moyennes `rating_film` et `rating_pick` en haut (encadré)
- Liste des membres : avatar + prénom + badge **Sélectionneur** pour le picker + tags
- Notes individuelles **non affichées** (seulement les moyennes anonymes)
- Le picker est mis en avant visuellement (fond différencié + badge accent)

### Verrou

- Automatique quand `COUNT(votes) = COUNT(profiles)` — calculé dynamiquement
- Votes modifiables AVANT verrou
- Résultats masqués jusqu'au verrou

### Rappel des non-votants

Email via **Resend** + Supabase Edge Function — déféré à l'étape 4.7.

---

## Schéma SQL (déployé en prod)

```sql
CREATE TABLE votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  journal_id BIGINT REFERENCES journal(id) ON DELETE CASCADE NOT NULL,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE SET NULL,

  -- Ratings 1–10
  rating_film    SMALLINT CHECK (rating_film  BETWEEN 1 AND 10),
  rating_pick    SMALLINT CHECK (rating_pick  BETWEEN 1 AND 10),

  -- Boolean flags
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

---

## Page Stats (étape 4.9)

### Contexte
- **13 films** dans le journal à ce jour (2026-05-28)
- Stats par **année de visionnage** (`watch_date` year), pas par année tirée
- **Périmètre v1 : 2024 et 2025 uniquement** — 2026 et palmarès global exclus
- Données **publiques**
- **4ème onglet de la tab bar**

### Structure envisagée (v1)

**Section "Année 2025"** puis **"Année 2024"**
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

## Statistiques exploitables

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

## Notes de session

### 2026-05-28 — Session de design
- Schéma finalisé : 2 ratings + 5 booléens avec logique conditionnelle
- Votes modifiables avant verrou automatique

### 2026-05-29 — Session d'implémentation
- Échelle passée de 1–5 à 1–10 (slider draggable, moyenne en numérique)
- `rating_pick` exclu du formulaire picker + exclu du calcul de sa moyenne
- Formulaire conditionnel picker vs non-picker implémenté
- Badge "Sélectionneur" dans les résultats
- Notes individuelles non affichées (moyennes anonymes uniquement)
- Labels résultats finalisés : Déjà vu, Content de le revoir, Découverte,
  Voulait le voir, Pas attiré, Surpris
- `wanted_to_see` = intérêt a priori (pas lié à la soirée) — compatible avec "Surpris"
- `database.types.ts` créé pour typage Supabase correct (résout erreur upsert)
- Rappel email (Resend) déféré à 4.7
